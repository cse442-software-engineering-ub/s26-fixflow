<?php
session_start();
require_once(__DIR__ . "/../db-connection.php");

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST" && $_SERVER["REQUEST_METHOD"] !== "PUT" && $_SERVER["REQUEST_METHOD"] !== "PATCH") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$userId = (int)$_SESSION["user_id"];
$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? [];

$full_name = isset($data["full_name"]) ? trim((string)$data["full_name"]) : null;
$email = isset($data["email"]) ? trim((string)$data["email"]) : null;
$username = isset($data["username"]) ? trim((string)$data["username"]) : null;
$phone = isset($data["phone"]) ? trim((string)$data["phone"]) : null;
$about_me = isset($data["about_me"]) ? trim((string)$data["about_me"]) : null;

// At least one field to update
if ($full_name === null && $email === null && $username === null && $phone === null && $about_me === null) {
    echo json_encode(["success" => false, "message" => "No fields to update"]);
    exit;
}

// Validate email if provided
if ($email !== null && $email !== "") {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email address"]);
        exit;
    }
}

// If username is being changed, ensure it's not taken by another user
if ($username !== null && $username !== "") {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $userId]);
    if ($stmt->fetch()) {
        echo json_encode(["success" => false, "message" => "Username already taken"]);
        exit;
    }
}

// Build update dynamically (only existing columns: full_name, email, username)
$updates = [];
$params = [];
if ($full_name !== null) {
    $updates[] = "full_name = ?";
    $params[] = $full_name;
}
if ($email !== null) {
    $updates[] = "email = ?";
    $params[] = $email;
}
if ($username !== null) {
    $updates[] = "username = ?";
    $params[] = $username;
}

// Optional: when users table has phone, about_me columns, add:
//   if ($phone !== null) { $updates[] = "phone = ?"; $params[] = $phone; }
//   if ($about_me !== null) { $updates[] = "about_me = ?"; $params[] = $about_me; }

if (empty($updates)) {
    echo json_encode(["success" => true, "message" => "Nothing to update"]);
    exit;
}

$params[] = $userId;
$sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode(["success" => true, "message" => "Profile updated"]);