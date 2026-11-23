const jwt = require("jsonwebtoken");
const { randomUUID } = require('node:crypto');
const { query } = require('../db/pool');

// Fail fast on startup if JWT_SECRET is missing — never hardcode a fallback secret.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const COOKIE_NAME = "nexus_token";

/**
 * Signs a short-lived JWT containing the user's identity & role, and stores it
 * in an HttpOnly cookie.
 *
 * Concept: HttpOnly cookies cannot be read by browser JavaScript (document.cookie),
 * which protects the session token from XSS attacks while still being sent
 * automatically by the browser on every API request.
 */
async function setAuthCookie(res, user) {
  const sessionId = randomUUID();
  await query("INSERT INTO sessions(id,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')", [sessionId,user.id]);
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d", jwtid: sessionId, algorithm: 'HS256' }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Authentication middleware: verifies the JWT from the HttpOnly cookie and
 * attaches `req.user` (`{ id, username, role }`). Rejects with 401 if missing/invalid.
 */
async function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    const err = new Error("Authentication required");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    return next(err);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!payload.jti) throw new Error('Session missing');
    const { rows } = await query('SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.user_id=$2 AND s.expires_at>now()', [payload.jti,payload.id]);
    if (!rows[0]) throw new Error('Session expired');
    req.user = rows[0];
    req.sessionId = payload.jti;
    next();
  } catch (cause) {
    if (cause.code && !['ERR_JWT_EXPIRED'].includes(cause.code)) return next(cause);
    const err = new Error("Invalid or expired session");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    next(err);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware: ensures the authenticated user
 * has one of the allowed roles (e.g., 'librarian' or 'admin').
 * Rejects unauthorized roles with 403 Forbidden.
 */
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

module.exports = {
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireRole,
};

