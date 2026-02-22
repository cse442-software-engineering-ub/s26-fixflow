<?php
session_start();
require_once(__DIR__ . "/../db-connection.php");

header("Content-Type: application/json; charset=utf-8");

// Check login
if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$userId = (int)$_SESSION["user_id"];

// Get user profile (PDO; users table: id, full_name, email, username, password_hash [+ optional phone, about_me])
$stmt = $pdo->prepare("SELECT id, full_name, email, username FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
    exit;
}

// Task card expects "name" in response; expose as both name and full_name
$user["name"] = $user["full_name"] ?? "";

// Optional profile fields (add to users table if needed: phone VARCHAR(32), about_me TEXT)
$user["phone"] = $user["phone"] ?? "";
$user["about_me"] = $user["about_me"] ?? "";

// Get assigned bugs (bugs table may use assigned_to as user id)
try {
    $stmtBugs = $pdo->prepare("SELECT id, title, status, priority FROM bugs WHERE assigned_to = ?");
    $stmtBugs->execute([$userId]);
    $bugs = $stmtBugs->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $bugs = [];
}

echo json_encode([
    "user" => $user,
    "assignedBugs" => $bugs
]);