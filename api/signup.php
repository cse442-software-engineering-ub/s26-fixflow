<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if (!$name || !$email || !$username || !$password) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

// checking duplicate username (case-sensitive)
$stmt = $pdo->prepare("SELECT id FROM users WHERE BINARY username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo json_encode(["success" => false, "message" => "Username already exists"]);
    exit;
}

// inserting user
$stmt = $pdo->prepare(
  "INSERT INTO users (full_name, email, username, password_hash)
   VALUES (?, ?, ?, ?)"
);
$stmt->execute([$name, $email, $username, $hash]);

echo json_encode(["success" => true]);

