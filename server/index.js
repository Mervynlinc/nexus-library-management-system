// Load .env variables into process.env before importing db/pool.js or auth.js.
require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const logger = require('./logger');
const { query, withTransaction } = require("./db/pool");
const {
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireRole,
} = require("./middleware/auth");

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// CLIENT_ORIGIN accepts a comma-separated allowlist, e.g.
// "http://localhost:3000,http://127.0.0.1:3000".
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Daily overdue fine in minor currency units (e.g. 2000 = 20.00).
const DAILY_FINE_CENTS = 2000;
const DAY_MS = 86_400_000;

// ----------------------------------------------------------------------------
// Global Middleware (CORS + Cookies + JSON Body Parser)
// ----------------------------------------------------------------------------
// Concept: Next.js runs on :3000 and Express runs on :4000 (different origins).
// `credentials: true` with an explicit `origin` lets the browser send/receive
// HttpOnly auth cookies across those two origins.
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(cookieParser());
app.use(express.json({limit:'4mb'}));
app.use('/api', (_req,res,next) => {res.set('Cache-Control','no-store');next()});
app.use('/api/manage', require('./management'));

// Simple in-memory rate limiter for /api/auth/login (max 10 failed attempts per
// 15 min per IP). Only failures count, and a successful login clears the
// counter, so ordinary repeated logins cannot lock a user out.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();

function pruneExpiredLoginAttempts(now) {
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}

function assertLoginAllowed(ip) {
  const now = Date.now();
  pruneExpiredLoginAttempts(now);

  const entry = loginAttempts.get(ip);
  if (entry && entry.count >= LOGIN_MAX_ATTEMPTS) {
    throw httpError(
      429,
      "TOO_MANY_REQUESTS",
      "Too many failed login attempts, try again later"
    );
  }
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  entry.count += 1;
}

function clearLoginFailures(ip) {
  loginAttempts.delete(ip);
}

/**
 * Creates a structured HTTP error that the central error handler formats as
 * `{ error: { code, message } }`.
 */
function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/**
 * Validates that a value is a positive integer ID at the API boundary.
 */
function parsePositiveInt(value, fieldName) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw httpError(400, "INVALID_INPUT", `${fieldName} must be a positive integer`);
  }
  return num;
}

// ----------------------------------------------------------------------------
// Health Check
// ----------------------------------------------------------------------------
app.get("/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Auth: Register, Login, Logout, Current User
// ----------------------------------------------------------------------------
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!username || username.length < 3 || username.length > 50) {
      throw httpError(400, "INVALID_USERNAME", "username must be at least 3 characters");
    }
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError(400, "INVALID_EMAIL", "A valid email is required");
    }
    if (password.length < 8 || Buffer.byteLength(password) > 72) {
      throw httpError(400, "WEAK_PASSWORD", "password must be at least 8 characters");
    }

    // Hash password with bcrypt (cost 10); never store plaintext.
    const passwordHash = await bcrypt.hash(password, 10);

    // Role is forced to 'member' server-side so a client cannot self-assign 'admin'.
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    );

    const user = rows[0];
    await setAuthCookie(res, user);
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "23505") {
      return next(httpError(409, "USER_EXISTS", "Username or email is already taken"));
    }
    next(err);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    assertLoginAllowed(req.ip);

    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!username || !password || username.length > 50 || Buffer.byteLength(password) > 72) {
      throw httpError(400, "INVALID_INPUT", "username and password are required");
    }

    const { rows } = await query(
      "SELECT id, username, email, password_hash, role FROM users WHERE username = $1",
      [username]
    );

    const user = rows[0];
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!valid) {
      recordLoginFailure(req.ip);
      throw httpError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    // Reaching this point proves the credentials were correct, so clear any
    // accumulated failures for this IP.
    clearLoginFailures(req.ip);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Issue signed JWT in an HttpOnly cookie so subsequent requests are authenticated.
    await setAuthCookie(res, safeUser);
    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM sessions WHERE id=$1', [req.sessionId]);
    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, username, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (rows.length === 0) {
      throw httpError(401, "UNAUTHORIZED", "User no longer exists");
    }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Books & Physical Copies (MVCC reads + Staff-only writes)
// ----------------------------------------------------------------------------
// Concept (MVCC): Catalog reads compute live availability from `copies` without
// locking rows, so hundreds of searches never block checkouts or returns.
app.get("/api/books", async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.published_year,
        COUNT(c.id)::int AS total_copies,
        COUNT(c.id) FILTER (WHERE c.status = 'available')::int AS available_copies
      FROM books b
      LEFT JOIN copies c ON c.book_id = b.id
      GROUP BY b.id
      ORDER BY b.title ASC
    `);
    res.json({ books: rows });
  } catch (err) {
    next(err);
  }
});

// Lists individual physical copies for a book (barcode + status).
app.get("/api/books/:id/copies", requireAuth, async (req, res, next) => {
  try {
    const bookId = parsePositiveInt(req.params.id, "id");
    const { rows } = await query(
      "SELECT id, book_id, barcode, status, created_at FROM copies WHERE book_id = $1 ORDER BY id ASC",
      [bookId]
    );
    res.json({ copies: rows });
  } catch (err) {
    next(err);
  }
});

// Staff-only (RBAC): creates a book title and its initial physical copies atomically.
app.post("/api/books", requireAuth, requireRole("librarian", "admin"), async (req, res, next) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const author = typeof req.body.author === "string" ? req.body.author.trim() : "";
    const isbn = typeof req.body.isbn === "string" ? req.body.isbn.trim() : "";
    const publishedYear = req.body.publishedYear ? Number(req.body.publishedYear) : null;
    const copyCount = req.body.copyCount ? parsePositiveInt(req.body.copyCount, "copyCount") : 1;

    if (!title || !author || !isbn) {
      throw httpError(400, "INVALID_INPUT", "title, author, and isbn are required");
    }

    const result = await withTransaction(async (client) => {
      const bookRes = await client.query(
        `INSERT INTO books (title, author, isbn, published_year)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, author, isbn, publishedYear]
      );
      const book = bookRes.rows[0];

      // Create `copyCount` physical copies so each has its own barcode & status.
      const copies = [];
      for (let i = 1; i <= copyCount; i += 1) {
        const barcode = `${isbn}-${String(i).padStart(3, "0")}`;
        const copyRes = await client.query(
          `INSERT INTO copies (book_id, barcode, status)
           VALUES ($1, $2, 'available')
           RETURNING *`,
          [book.id, barcode]
        );
        copies.push(copyRes.rows[0]);
      }

      return { book, copies };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === "23505") {
      return next(httpError(409, "DUPLICATE_ISBN", "A book with this ISBN already exists"));
    }
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Loans: List, Checkout, Return (State Machine + ACID Transactions)
// ----------------------------------------------------------------------------
// Concept (Authorization): Members only see their own loans; librarians/admins see all.
app.get("/api/loans", requireAuth, async (req, res, next) => {
  try {
    const isStaff = req.user.role === "librarian" || req.user.role === "admin";
    const { rows } = await query(
      `SELECT
         l.id, l.copy_id, l.user_id, l.status, l.issued_at, l.due_at, l.returned_at,
         c.barcode, b.title AS book_title, u.username
       FROM loans l
       JOIN copies c ON c.id = l.copy_id
       JOIN books b ON b.id = c.book_id
       JOIN users u ON u.id = l.user_id
       ${isStaff ? "" : "WHERE l.user_id = $1"}
       ORDER BY l.issued_at DESC`,
      isStaff ? [] : [req.user.id]
    );
    res.json({ loans: rows });
  } catch (err) {
    next(err);
  }
});

// Issues a physical copy to a user inside an ACID transaction with row-level locking.
app.post("/api/loans/checkout", requireAuth, async (req, res, next) => {
  try {
    const copyId = parsePositiveInt(req.body.copyId, "copyId");
    const isStaff = req.user.role === "librarian" || req.user.role === "admin";

    // Security: A member can only check out for themselves; staff can specify userId.
    const userId =
      isStaff && req.body.userId ? parsePositiveInt(req.body.userId, "userId") : req.user.id;

    const dueDate = new Date(req.body.dueAt);
    if (!req.body.dueAt || Number.isNaN(dueDate.getTime()) || dueDate <= new Date()) {
      throw httpError(400, "INVALID_DUE_DATE", "dueAt must be a valid future ISO date");
    }

    const loan = await withTransaction(async (client) => {
      // Concept (Pessimistic Row Lock): FOR UPDATE locks only this physical copy row
      // until COMMIT/ROLLBACK, preventing two concurrent requests from double-loaning it.
      const copyRes = await client.query(
        "SELECT id, status FROM copies WHERE id = $1 FOR UPDATE",
        [copyId]
      );
      if (copyRes.rowCount === 0) {
        throw httpError(404, "COPY_NOT_FOUND", "Physical copy not found");
      }
      if (copyRes.rows[0].status !== "available") {
        throw httpError(409, "COPY_UNAVAILABLE", `Copy is currently ${copyRes.rows[0].status}`);
      }

      const userRes = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
      if (userRes.rowCount === 0) {
        throw httpError(404, "USER_NOT_FOUND", "User not found");
      }

      const loanRes = await client.query(
        `INSERT INTO loans (copy_id, user_id, status, due_at)
         VALUES ($1, $2, 'active', $3)
         RETURNING *`,
        [copyId, userId, dueDate.toISOString()]
      );

      await client.query("UPDATE copies SET status = 'loaned' WHERE id = $1", [copyId]);
      return loanRes.rows[0];
    });

    res.status(201).json({ loan });
  } catch (err) {
    next(err);
  }
});

// Transitions a loan to 'returned', frees the copy, and records an auditable fine if overdue.
app.post("/api/loans/:id/return", requireAuth, async (req, res, next) => {
  try {
    const loanId = parsePositiveInt(req.params.id, "id");
    const isStaff = req.user.role === "librarian" || req.user.role === "admin";

    const result = await withTransaction(async (client) => {
      const loanRes = await client.query(
        "SELECT id, copy_id, user_id, status, due_at FROM loans WHERE id = $1 FOR UPDATE",
        [loanId]
      );
      if (loanRes.rowCount === 0) {
        throw httpError(404, "LOAN_NOT_FOUND", "Loan not found");
      }

      const existing = loanRes.rows[0];
      if (!isStaff && existing.user_id !== req.user.id) {
        throw httpError(403, "FORBIDDEN", "You can only return your own loans");
      }
      if (existing.status === "returned") {
        throw httpError(409, "ALREADY_RETURNED", "Loan has already been returned");
      }

      const updatedLoanRes = await client.query(
        `UPDATE loans
         SET status = 'returned', returned_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [loanId]
      );

      await client.query("UPDATE copies SET status = 'available' WHERE id = $1", [
        existing.copy_id,
      ]);

      // Concept (Auditable Derived State): Fine is computed server-side in UTC and
      // persisted as its own record tied 1-to-1 to the loan.
      let fine = null;
      const now = new Date();
      const dueAt = new Date(existing.due_at);
      const overdueDays = Math.floor((now.getTime() - dueAt.getTime()) / DAY_MS);

      if (overdueDays > 0) {
        const fineRes = await client.query(
          `INSERT INTO fines (loan_id, user_id, amount_cents, status)
           VALUES ($1, $2, $3, 'outstanding')
           RETURNING *`,
          [loanId, existing.user_id, overdueDays * DAILY_FINE_CENTS]
        );
        fine = fineRes.rows[0];
      }

      return { loan: updatedLoanRes.rows[0], fine };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Fines: List & Mark Paid (RBAC)
// ----------------------------------------------------------------------------
app.get("/api/fines", requireAuth, async (req, res, next) => {
  try {
    const isStaff = req.user.role === "librarian" || req.user.role === "admin";
    const { rows } = await query(
      `SELECT f.*, u.username, b.title AS book_title
       FROM fines f
       JOIN users u ON u.id = f.user_id
       JOIN loans l ON l.id = f.loan_id
       JOIN copies c ON c.id = l.copy_id
       JOIN books b ON b.id = c.book_id
       ${isStaff ? "" : "WHERE f.user_id = $1"}
       ORDER BY f.created_at DESC`,
      isStaff ? [] : [req.user.id]
    );
    res.json({ fines: rows });
  } catch (err) {
    next(err);
  }
});

app.post(
  "/api/fines/:id/pay",
  requireAuth,
  requireRole("librarian", "admin"),
  async (req, res, next) => {
    try {
      const fineId = parsePositiveInt(req.params.id, "id");

      const { rows } = await query(
        `UPDATE fines
         SET status = 'paid', paid_at = NOW()
         WHERE id = $1 AND status = 'outstanding'
         RETURNING *`,
        [fineId]
      );

      if (rows.length === 0) {
        throw httpError(404, "FINE_NOT_PAYABLE", "Outstanding fine not found");
      }

      res.json({ fine: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// ----------------------------------------------------------------------------
// Central Error Handler (Consistent API error shape, no leaked stack traces)
// ----------------------------------------------------------------------------
app.use((_req,res) => res.status(404).json({error:{code:'NOT_FOUND',message:'Endpoint not found'}}));
app.use((err, _req, res, _next) => {
  const databaseConflict = ['23505', '23503'].includes(err.code);
  const status = databaseConflict ? 409 : err.status || 500;
  const code = databaseConflict ? 'CONFLICT' : status >= 500 ? 'INTERNAL_ERROR' : err.code || 'INVALID_INPUT';

  if (status >= 500) {
    logger.error('Request failed', {code:err.code, method:_req.method, path:_req.path});
  }

  res.status(status).json({
    error: {
      code,
      message: databaseConflict ? 'A duplicate record exists or this record is still referenced by another record.' : status >= 500 ? "An unexpected server error occurred" : err.message,
    },
  });
});

if (require.main === module) {
  query('SELECT id FROM sessions LIMIT 1').then(() => {
    app.listen(PORT, () => console.info(`[server] Nexus API listening on port ${PORT}`));
  }).catch(err => {console.error('[server] Database unavailable or schema missing. Run npm run db:init.', err.message);process.exitCode=1;require('./db/pool').pool.end()});
}
module.exports = app;
