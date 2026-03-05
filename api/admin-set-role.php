<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";

$admin = requireAdmin($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$userId = isset($data["userId"]) ? (int)$data["userId"] : 0;
$role = isset($data["role"]) ? trim((string)$data["role"]) : "";

if ($userId <= 0 || !in_array($role, ["admin", "developer"], true)) {
    echo json_encode(["success" => false, "message" => "userId and valid role are required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }

    setUserRole($pdo, $userId, $role);

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_set_role",
        "user",
        (string)$userId,
        "Set role to " . $role . " for " . (string)$user["username"]
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to set role"]);
}
