<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";

$admin = requireAdmin($pdo);
$limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 100;
if ($limit <= 0) $limit = 100;
if ($limit > 500) $limit = 500;

try {
    ensureRoleAndAuditTables($pdo);
    $stmt = $pdo->prepare("
        SELECT id, actor_username, action, target_type, target_id, details, created_at
        FROM audit_logs
        ORDER BY id DESC
        LIMIT :limit_rows
    ");
    $stmt->bindValue(":limit_rows", $limit, PDO::PARAM_INT);
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_view_audit_log",
        "audit",
        null,
        "Viewed audit logs"
    );

    echo json_encode(["success" => true, "logs" => $logs]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to load audit logs"]);
}
