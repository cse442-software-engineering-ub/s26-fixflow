<?php
session_start();
header("Content-Type: application/json");

require_once(__DIR__ . "/db-connection.php");
require_once(__DIR__ . "/admin-helpers.php");

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if (!$username || !$password) {
    echo json_encode(["success" => false, "message" => "All fields required"]);
    exit;
}

$stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE BINARY username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user["password_hash"])) {
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    exit;
}

$_SESSION["user_id"] = (int)$user["id"];
$_SESSION["username"] = $user["username"];

// Track last successful login for admin/audit visibility.
ensureUsersLastLoginColumn($pdo);
$stmtUpdate = $pdo->prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?");
$stmtUpdate->execute([(int)$user["id"]]);

echo json_encode(["success" => true, "username" => $user["username"]]);

