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
$full_name = isset($data["full_name"]) ? trim((string)$data["full_name"]) : null;
$email = isset($data["email"]) ? trim((string)$data["email"]) : null;
$username = isset($data["username"]) ? trim((string)$data["username"]) : null;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "userId is required"]);
    exit;
}

if ($email !== null && $email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address"]);
    exit;
}

try {
    // Ensure user exists
    $check = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $check->execute([$userId]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }

    // If username is changing, ensure not taken by another user
    if ($username !== null && $username !== "") {
        $conflict = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $conflict->execute([$username, $userId]);
        if ($conflict->fetch()) {
            echo json_encode(["success" => false, "message" => "Username already taken"]);
            exit;
        }
    }

    $updates = [];
    $params = [];

    if ($full_name !== null) {
        $updates[] = "full_name = ?";
        $params[] = $full_name;
    }
    if ($email !== null) {
        $updates[] = "email = ?";
        $params[] = $email;
    }
    if ($username !== null) {
        $updates[] = "username = ?";
        $params[] = $username;
    }

    if (empty($updates)) {
        echo json_encode(["success" => true, "message" => "Nothing to update"]);
        exit;
    }

    $params[] = $userId;
    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_update_user",
        "user",
        (string)$userId,
        json_encode(["full_name" => $full_name, "email" => $email, "username" => $username])
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to update user"]);
}

