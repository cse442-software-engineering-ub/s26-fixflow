<?php
header("Content-Type: application/json");

require "db-connection.php";

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data["email"] ?? "");
$code = trim($data["code"] ?? "");
$password = $data["password"] ?? "";

if (!$email || !$code || !$password) {
  echo json_encode(["success" => false, "message" => "All fields required"]);
  exit;
}

$stmt = $pdo->prepare(
  "SELECT reset_code, reset_expires FROM users WHERE email = ?"
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (
  !$user ||
  $user["reset_code"] !== $code ||
  strtotime($user["reset_expires"]) < time()
) {
  echo json_encode(["success" => false, "message" => "Invalid or expired code"]);
  exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
  "UPDATE users
   SET password_hash = ?, reset_code = NULL, reset_expires = NULL
   WHERE email = ?"
);
$stmt->execute([$hash, $email]);

echo json_encode(["success" => true]);
