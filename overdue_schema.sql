-- ============================================================
-- FixFlow - Overdue Bugs Database Schema
-- Database: overdue_db  (standalone, no localhost dependency)
-- ============================================================

CREATE DATABASE IF NOT EXISTS overdue_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE overdue_db;

-- ------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table: bugs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bugs (
    id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    status           ENUM(
                         'Open',
                         'In Progress',
                         'Resolved',
                         'Closed'
                     ) NOT NULL DEFAULT 'Open',
    priority         ENUM(
                         'Low',
                         'Medium',
                         'High',
                         'Critical'
                     ) NOT NULL DEFAULT 'Medium',
    due_date         DATE         NOT NULL,
    assigned_user_id INT UNSIGNED,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bugs_user
        FOREIGN KEY (assigned_user_id)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Index to speed up the overdue query (due_date + status filter)
CREATE INDEX idx_bugs_due_status ON bugs (due_date, status);

-- ============================================================
-- Sample data
-- ============================================================

INSERT INTO users (username, email, password_hash) VALUES
    ('alice',   'alice@example.com',   '$2y$12$placeholderHashAlice'),
    ('bob',     'bob@example.com',     '$2y$12$placeholderHashBob'),
    ('charlie', 'charlie@example.com', '$2y$12$placeholderHashCharlie');

INSERT INTO bugs (title, description, status, priority, due_date, assigned_user_id) VALUES
    -- Overdue (past due, not resolved/closed)
    ('Login page crashes on mobile',   'Reproducible on iOS Safari 17',    'Open',        'Critical', '2026-01-15', 1),
    ('Broken export to CSV',           'Empty file generated for >500 rows','In Progress', 'High',     '2026-02-01', 2),
    ('Pagination skips page 3',        'Affects browse.html list view',     'Open',        'Medium',   '2026-02-10', 3),
    ('Email notifications not sent',   'SMTP config missing in prod',       'In Progress', 'High',     '2026-02-20', 1),

    -- Not overdue (future due dates)
    ('Dark mode flicker on load',      'Brief white flash before theme',    'Open',        'Low',      '2026-03-15', 2),
    ('Search bar returns wrong order', 'Relevance scoring off',             'Open',        'Medium',   '2026-04-01', 3),

    -- Resolved/Closed (excluded by overdue query)
    ('Typo on signup page',            'Fixed heading text',                'Resolved',    'Low',      '2026-01-01', 1),
    ('404 on /reset endpoint',         'Route was missing',                 'Closed',      'High',     '2026-01-20', 2);
