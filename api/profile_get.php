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

// Get user profile
$stmt = $conn->prepare("SELECT id, username, email FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
    exit;
}

// Get assigned bugs
$stmt2 = $conn->prepare("SELECT id, title, status, priority FROM bugs WHERE assigned_to = ?");
$stmt2->bind_param("i", $userId);
$stmt2->execute();
$result2 = $stmt2->get_result();

$bugs = [];
while ($row = $result2->fetch_assoc()) {
    $bugs[] = $row;
}

echo json_encode([
    "user" => $user,
    "assignedBugs" => $bugs
]);