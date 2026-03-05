<?php
header("Content-Type: application/json");

require "db-conection.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if (!$username || !$password) {
    echo json_encode(["success" => false, "message" => "All fields required"]);
    exit;
}

$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user["password_hash"])) {
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    exit;
}

echo json_encode(["success" => true]);

