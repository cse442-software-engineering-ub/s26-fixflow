<?php
header("Content-Type: application/json");

require "db-connection.php";

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

// checking duplicate username
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
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
