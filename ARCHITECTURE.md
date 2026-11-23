# Nexus — Client-Server Architecture Guide

A simple guide explaining how the semester's Client-Server concepts are implemented in Nexus, with exact file paths, code snippets, and plain-English explanations of what each piece of code is doing.

---

## 1. 3-Tier Client-Server Architecture (`L1_IntroClientServer`, `L2_Client_vs_Server`)

Nexus is split into three separate layers communicating over TCP/IP ports:

- **Client (Presentation Tier — `:3000`)**: Next.js React app (`app/`, `components/`, `lib/api.ts`)
- **Server (Application Tier — `:4000`)**: Express.js REST API (`server/index.js`)
- **Database (Data Tier — `:5432`)**: PostgreSQL (`server/db/schema.sql`)

### Client API Helper
File: `lib/api.ts` (lines 12–33)
```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
```
**What this code is doing:**
1. Points all frontend API calls to `http://localhost:4000` (the Express server).
2. Calls the browser's `fetch()` with `credentials: "include"` so the browser automatically sends and saves the login cookie across ports (`:3000` ↔ `:4000`).
3. Sets `Content-Type: application/json` so Express knows the body is JSON.
4. Parses the JSON response; if the HTTP status is an error (like `401` or `409`), it reads `data.error.message` and throws an error for the UI to display.

### Login Request on the Client
File: `app/login/page.tsx` (lines 25–30)
```ts
function loginRequest(credentials: LoginFormState): Promise<void> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then(() => undefined);
}
```
**What this code is doing:**
1. Takes the `{ username, password }` from the login form.
2. Converts it to a JSON string (`JSON.stringify`) and sends a `POST` request to `/api/auth/login` on the Express server.
3. If Express returns `200 OK`, the login page redirects the user to `/`; if Express returns `401`, the error message is shown under the password input.

---

## 2. Middleware (`L3_Middleware`, `Middleware`)

Middleware functions run *between* receiving a request and sending back the final response.

### A. Global Express Middleware Pipeline
File: `server/index.js` (lines 30–32)
```js
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
```
**What this code is doing:**
1. `cors(...)`: Tells the browser it is safe for `http://localhost:3000` (Next.js) to call `http://localhost:4000` (Express) and include cookies (`credentials: true`).
2. `cookieParser()`: Reads the raw `Cookie` header from incoming requests and puts it into `req.cookies` so our auth middleware can read `req.cookies.nexus_token`.
3. `express.json()`: Reads incoming JSON request bodies and puts them into `req.body` (used by `/login`, `/register`, `/checkout`, etc.).

### B. Authentication & RBAC Middleware
File: `server/middleware/auth.js` (lines 45–81)
```js
function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    const err = new Error("Authentication required");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    return next(err);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch {
    const err = new Error("Invalid or expired session");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const err = new Error("You do not have permission to perform this action");
      err.status = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    next();
  };
}
```
**What this code is doing:**
1. `requireAuth` checks if the `nexus_token` cookie exists. If missing, it stops the request and sends `401 Unauthorized`.
2. If the cookie exists, `jwt.verify(...)` checks the cryptographic signature using `JWT_SECRET`. If valid, it attaches `{ id, username, role }` to `req.user` and calls `next()` to continue to the route.
3. `requireRole("librarian", "admin")` runs *after* `requireAuth`. It checks `req.user.role` — if a normal `'member'` tries to call a staff-only route (like adding a book or marking a fine paid), it stops them with `403 Forbidden`.

### C. Central Error-Handling Middleware
File: `server/index.js` (lines 462–476)
```js
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";

  if (status >= 500) {
    console.error("[server] Unhandled error:", err);
  }

  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? "An unexpected server error occurred" : err.message,
    },
  });
});
```
**What this code is doing:**
1. Whenever any route calls `next(err)` or throws an error, Express jumps here instead of crashing.
2. If it's a `500` server/database crash, it logs the real error on the server terminal for debugging, but sends a safe generic message to the client so internal details/stack traces are never leaked.
3. Formats every error in one consistent JSON shape: `{ error: { code, message } }`.

---

## 3. Concurrency (`L4_concurrency`)

### A. Connection Pooling (Shared DB Connections)
File: `server/db/pool.js` (lines 11–26)
```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function query(text, params) {
  return pool.query(text, params);
}
```
**What this code is doing:**
1. Opens a pool of reusable connections to PostgreSQL once at startup using `DATABASE_URL` from `.env`.
2. When 20 users send requests at the same time, `query()` borrows an idle connection from the pool, runs the parameterized SQL (`$1, $2` to block SQL injection), and immediately returns the connection to the pool.

### B. ACID Transactions (`BEGIN` / `COMMIT` / `ROLLBACK`)
File: `server/db/pool.js` (lines 33–47)
```js
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```
**What this code is doing:**
1. Checks out one dedicated DB connection (`pool.connect()`) and starts a transaction (`BEGIN`).
2. Runs all SQL steps inside `fn(client)`. If every step succeeds, `COMMIT` saves all changes permanently.
3. If *any* step throws an error halfway through, `ROLLBACK` undoes everything so the database is never left half-updated (e.g., a loan created without marking the copy as `'loaned'`).
4. `finally { client.release(); }` guarantees the connection goes back to the pool no matter what happens.

### C. Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)
File: `server/index.js` (lines 312–341)
```js
const loan = await withTransaction(async (client) => {
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
  ...
  const loanRes = await client.query(
    `INSERT INTO loans (copy_id, user_id, status, due_at)
     VALUES ($1, $2, 'active', $3)
     RETURNING *`,
    [copyId, userId, dueDate.toISOString()]
  );

  await client.query("UPDATE copies SET status = 'loaned' WHERE id = $1", [copyId]);
  return loanRes.rows[0];
});
```
**What this code is doing:**
1. `FOR UPDATE` locks **only that single physical copy row** in PostgreSQL until `COMMIT` or `ROLLBACK`.
2. If Patron A and Patron B click "Checkout" on the same copy at the exact same millisecond, Patron A's transaction locks the row first, creates the loan, and updates `status = 'loaned'`.
3. Patron B's query waits for A to finish, then reads `status = 'loaned'`, hits `if (copyRes.rows[0].status !== "available")`, and cleanly receives `409 COPY_UNAVAILABLE` — preventing double-lending.

### D. Database-Level Uniqueness Constraint
File: `server/db/schema.sql` (lines 56–58)
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_loan_per_copy
  ON loans (copy_id)
  WHERE status IN ('pending', 'active', 'overdue');
```
**What this code is doing:**
1. Tells PostgreSQL: a `copy_id` can appear **at most once** in the `loans` table while its status is open (`pending`, `active`, or `overdue`).
2. Acts as a final safety net inside the database itself — even if application code had a bug, Postgres refuses to insert a second active loan for the same copy.

### E. MVCC (Non-Blocking Catalog Reads)
File: `server/index.js` (lines 189–209)
```js
app.get("/api/books", async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        b.id, b.title, b.author, b.isbn, b.published_year,
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
```
**What this code is doing:**
1. Counts how many physical copies each book has (`total_copies`) and how many are currently `'available'` (`available_copies`) directly from the live `copies` table.
2. Because PostgreSQL uses **MVCC (Multi-Version Concurrency Control)**, these `SELECT` reads never lock rows and never get blocked when librarians/patrons are checking out or returning books at the same time.

---

## 4. Sockets (`L5_socketsreal`)

We do not write raw `net.Socket` code manually — TCP sockets operate underneath every layer:
- **Client → Server**: `fetch()` in `lib/api.ts` opens a TCP socket connection to `localhost:4000` to send HTTP requests.
- **Server Listening Socket**: `app.listen(PORT)` in `server/index.js` (line 478) binds a TCP socket on port `4000` to accept incoming client connections.
- **Server → Database**: `pg.Pool` in `server/db/pool.js` keeps persistent TCP sockets open to PostgreSQL on port `5432` to send SQL queries and receive rows.

---

## 5. RPC & RMI (`Remote Procedure call`, `L10_rmi`)

- **How Nexus compares**: Instead of Java RMI (which calls remote Java methods using language-specific stubs/skeletons) or binary RPC, Nexus uses **REST over HTTP + JSON** — data is serialized with `JSON.stringify` on the client (`lib/api.ts`) and deserialized with `express.json()` on the server (`server/index.js`).
- Action endpoints such as `POST /api/loans/checkout` (`server/index.js`, line 298) and `POST /api/loans/:id/return` (`server/index.js`, line 349) follow the same core principle as RPC — triggering a server-side procedure over the network and returning the result — using standard HTTP + JSON so any web or mobile client can call them.
