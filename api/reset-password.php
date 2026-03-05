<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["success" => false, "message" => "Method not allowed"]);
  exit;
}

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
  (string)$user["reset_code"] !== (string)$code ||
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

