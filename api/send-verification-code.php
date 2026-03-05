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

if (!$email) {
  echo json_encode(["success" => false, "message" => "Email required"]);
  exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
  echo json_encode(["success" => false, "message" => "Email not found"]);
  exit;
}

$code = random_int(100000, 999999);
$expires = date("Y-m-d H:i:s", time() + 600); // 10 min and then the code expires

$stmt = $pdo->prepare(
  "UPDATE users SET reset_code = ?, reset_expires = ? WHERE email = ?"
);
$stmt->execute([$code, $expires, $email]);

$sent = false;

// attempt with UB emails only
if (str_ends_with($email, "@buffalo.edu")) {
  $subject = "FixFlow Password Reset Code";
  $message = "Your FixFlow verification code is: $code\n\n"
           . "This code will expire in 10 minutes.";
  $headers = "From: no-reply@buffalo.edu\r\n";

  $sent = mail($email, $subject, $message, $headers);

  if ($sent) {
    echo json_encode([
      "success" => true,
      "message" => "Verification code sent to your UB email."
    ]);
    exit;
  }

  echo json_encode([
    "success" => true,
    "message" => "Email failed to send. Demo code provided.",
    "demo_code" => $code
  ]);
  exit;
}

// for DEMO (with non ub emails that exist as accounts in the webiste)
echo json_encode([
  "success" => true,
  "message" => "Email failed to send (UB server mail restrictions). Demo code provided.",
  "demo_code" => $code
]);

