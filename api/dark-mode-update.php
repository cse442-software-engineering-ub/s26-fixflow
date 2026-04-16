<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST" && $_SERVER["REQUEST_METHOD"] !== "PUT") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

require_once __DIR__ . "/db-connection.php";

$userId = (int)$_SESSION["user_id"];
$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? [];

if (!array_key_exists("theme_preference", $data)) {
    echo json_encode(["success" => false, "message" => "Missing theme_preference field"]);
    exit;
}

$theme = $data["theme_preference"] === "dark" ? "dark" : "light";

$stmt = $pdo->prepare("UPDATE users SET theme_preference = ? WHERE id = ?");
$stmt->execute([$theme, $userId]);

echo json_encode(["success" => true, "theme_preference" => $theme]);
