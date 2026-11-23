-- ============================================================================
-- Nexus Library Management System — Core PostgreSQL Schema (Phase 1)
-- ============================================================================
-- All timestamps use TIMESTAMPTZ (stored in UTC by Postgres) so due dates and
-- overdue checks do not drift across timezones.
-- ============================================================================

-- 1. USERS: Both patrons ('member') and staff ('librarian', 'admin').
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('member', 'librarian', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BOOKS: The abstract title/work (not a physical item on the shelf).
CREATE TABLE IF NOT EXISTS books (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  author         TEXT NOT NULL,
  isbn           TEXT UNIQUE NOT NULL,
  published_year INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COPIES: Individual physical, lendable items belonging to a book.
--    Keeping copies separate from books lets us track availability per copy
--    and lock a single physical copy during checkout without blocking reads.
CREATE TABLE IF NOT EXISTS copies (
  id         SERIAL PRIMARY KEY,
  book_id    INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  barcode    TEXT UNIQUE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'available'
             CHECK (status IN ('available', 'loaned', 'reserved', 'lost', 'damaged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Speeds up counting available copies per book (e.g. catalog search).
CREATE INDEX IF NOT EXISTS idx_copies_book_status ON copies (book_id, status);

-- 4. LOANS: Long-duration state machine linking a physical copy to a user.
--    Valid lifecycle: pending -> active -> returned (or overdue -> returned).
CREATE TABLE IF NOT EXISTS loans (
  id          SERIAL PRIMARY KEY,
  copy_id     INT NOT NULL REFERENCES copies(id) ON DELETE RESTRICT,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('pending', 'active', 'returned', 'overdue')),
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at      TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ
);

-- Database-level safety net: a physical copy can only have ONE open loan at a
-- time. Even if app code has a bug, Postgres rejects a double-checkout.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_loan_per_copy
  ON loans (copy_id)
  WHERE status IN ('pending', 'active', 'overdue');

-- 5. FINES: Auditable penalty record tied 1-to-1 to an overdue loan.
--    Stored in integer minor units (cents) to avoid floating-point rounding bugs.
CREATE TABLE IF NOT EXISTS fines (
  id           SERIAL PRIMARY KEY,
  loan_id      INT NOT NULL UNIQUE REFERENCES loans(id) ON DELETE RESTRICT,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents INT NOT NULL CHECK (amount_cents >= 0),
  status       TEXT NOT NULL DEFAULT 'outstanding'
               CHECK (status IN ('outstanding', 'paid', 'waived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at      TIMESTAMPTZ
);

