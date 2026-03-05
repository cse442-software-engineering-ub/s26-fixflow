<?php
$driver = strtolower(getenv("FIXFLOW_DB_DRIVER") ?: "mysql"); // mysql | sqlite
$host = getenv("FIXFLOW_DB_HOST") ?: "localhost";
$dbname = getenv("FIXFLOW_DB_NAME") ?: "cse442_2026_spring_team_ab_db";
$user = getenv("FIXFLOW_DB_USER") ?: "";
$pass = getenv("FIXFLOW_DB_PASS") ?: "";

try {
    if ($driver === "sqlite") {
        $dbPath = __DIR__ . "/dev.sqlite";
        $pdo = new PDO("sqlite:" . $dbPath, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec("PRAGMA foreign_keys = ON;");

        // Minimal schema for local dev/testing
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                reset_code TEXT NULL,
                reset_expires TEXT NULL
            );
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS bugs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                created_at TEXT NOT NULL,
                due_date TEXT NULL,
                assigned_user_id INTEGER NULL,
                FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        ");
    } else {
        // Prefer a shared db-connection.php if present.
        // Supports both:
        // - .../cse-442ab/NewFrontend/api  -> ../../db-connection.php
        // - .../cse-442ab/api              -> ../db-connection.php
        $candidateSharedConnections = [
            __DIR__ . "/../../db-connection.php",
            __DIR__ . "/../db-connection.php",
        ];
        $sharedLoaded = false;
        foreach ($candidateSharedConnections as $candidate) {
            if (file_exists($candidate)) {
                require_once $candidate;
                if (isset($pdo)) {
                    $sharedLoaded = true;
                    break;
                }
            }
        }

        if (!$sharedLoaded) {
            // Fallback: env-based MySQL (for other deployments)
            if ($user === "" || $pass === "") {
                throw new PDOException("Missing MySQL credentials (FIXFLOW_DB_USER / FIXFLOW_DB_PASS)");
            }
            $pdo = new PDO(
                "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

