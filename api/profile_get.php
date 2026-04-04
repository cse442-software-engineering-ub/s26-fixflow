<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

// Check login
if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

require_once(__DIR__ . "/db-connection.php");
require_once(__DIR__ . "/bug-id-helpers.php");
require_once(__DIR__ . "/user-profile-helpers.php");

$userId = (int)$_SESSION["user_id"];

ensureUserAvatarColumns($pdo);

// Get user profile (PDO; include created_at for "Member Since")
$stmt = $pdo->prepare("SELECT id, full_name, email, username, created_at, avatar_gradient, avatar_image FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$user["name"] = $user["full_name"] ?? "";
$user["phone"] = $user["phone"] ?? "";
$user["about_me"] = $user["about_me"] ?? "";
if (!isset($user["avatar_gradient"]) || $user["avatar_gradient"] === "" || $user["avatar_gradient"] === null) {
    $user["avatar_gradient"] = "gradient-blue";
}
if (!isset($user["avatar_image"]) || $user["avatar_image"] === "") {
    $user["avatar_image"] = null;
}

// Get assigned bugs
try {
    $stmtBugs = $pdo->prepare("SELECT id, title, status, priority FROM bugs WHERE assigned_user_id = ?");
    $stmtBugs->execute([$userId]);
    $bugs = $stmtBugs->fetchAll(PDO::FETCH_ASSOC);
    foreach ($bugs as &$bug) {
        $bugId = isset($bug["id"]) ? (int)$bug["id"] : 0;
        if ($bugId > 0) {
            $bug["bugNumber"] = formatBugNumber(getOrCreateBugNumber($pdo, $bugId));
        }
    }
    unset($bug);
} catch (Exception $e) {
    $bugs = [];
}

echo json_encode([
    "user" => $user,
    "assignedBugs" => $bugs
]);

