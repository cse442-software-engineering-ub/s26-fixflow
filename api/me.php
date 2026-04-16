<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";
require_once __DIR__ . "/user-profile-helpers.php";

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    echo json_encode(["authenticated" => false]);
    exit;
}

$userId = (int)$_SESSION["user_id"];
$username = (string)($_SESSION["username"] ?? "");

ensureUserAvatarColumns($pdo);
$stmt = $pdo->prepare("SELECT full_name, avatar_gradient, avatar_image, theme_preference FROM users WHERE id = ?");
$stmt->execute([$userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

echo json_encode([
    "authenticated" => true,
    "user_id" => $userId,
    "username" => $username,
    "full_name" => isset($row["full_name"]) ? $row["full_name"] : null,
    "avatar_gradient" => isset($row["avatar_gradient"]) && $row["avatar_gradient"] !== "" && $row["avatar_gradient"] !== null
        ? (string)$row["avatar_gradient"]
        : "gradient-blue",
    "avatar_image" => isset($row["avatar_image"]) && $row["avatar_image"] !== "" && $row["avatar_image"] !== null
        ? (string)$row["avatar_image"]
        : null,
    "role" => getUserRole($pdo, $userId, $username),
    "theme_preference" => isset($row["theme_preference"]) && $row["theme_preference"] === "dark" ? "dark" : "light",
]);

