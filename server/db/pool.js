const { Pool } = require("pg");
const logger = require('../logger');

// Fail fast on startup if DATABASE_URL is missing instead of hanging on first query.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// One shared connection pool for the entire Express process.
// Reusing pooled connections avoids the overhead of opening a new TCP/TLS
// handshake to Postgres on every HTTP request.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  query_timeout: 15000,
});

// Log unexpected errors on idle background clients so the process doesn't crash silently.
pool.on("error", (err) => {
  logger.error('Unexpected idle database client error', {code:err.code});
});

/**
 * Runs a single parameterized SQL query using a pooled connection.
 * Always pass values in `params` ($1, $2, ...) — never interpolate user input into `text`.
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Runs `fn(client)` inside an ACID PostgreSQL transaction (BEGIN -> COMMIT).
 * If anything inside `fn` throws, it automatically issues ROLLBACK so no partial
 * writes (e.g., loan created without marking copy as loaned) can survive.
 */
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
    // Always return the client to the pool, whether the transaction succeeded or failed.
    client.release();
  }
}

module.exports = { pool, query, withTransaction };

