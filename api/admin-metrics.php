<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/admin-helpers.php";

$admin = requireAdmin($pdo);

try {
    $usersTotal = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $bugsTotal = (int)$pdo->query("SELECT COUNT(*) FROM bugs")->fetchColumn();
    $bugsResolved = (int)$pdo->query("SELECT COUNT(*) FROM bugs WHERE status IN ('Resolved', 'Closed')")->fetchColumn();
    $bugsOpen = (int)$pdo->query("SELECT COUNT(*) FROM bugs WHERE status NOT IN ('Resolved', 'Closed')")->fetchColumn();
    $bugsUnassigned = (int)$pdo->query("SELECT COUNT(*) FROM bugs WHERE assigned_user_id IS NULL")->fetchColumn();
    $bugsOverdue = (int)$pdo->query("SELECT COUNT(*) FROM bugs WHERE status NOT IN ('Resolved', 'Closed') AND due_date IS NOT NULL AND due_date < CURRENT_DATE")->fetchColumn();

    $stmtTop = $pdo->query("
        SELECT u.username, COUNT(*) AS bug_count
        FROM bugs b
        JOIN users u ON u.id = b.assigned_user_id
        WHERE b.status NOT IN ('Resolved', 'Closed')
        GROUP BY u.username
        ORDER BY bug_count DESC, u.username ASC
        LIMIT 5
    ");
    $topAssignees = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

    logAudit(
        $pdo,
        (int)$admin["id"],
        (string)$admin["username"],
        "admin_view_metrics",
        "metrics",
        null,
        "Viewed admin metrics"
    );

    echo json_encode([
        "success" => true,
        "metrics" => [
            "users_total" => $usersTotal,
            "bugs_total" => $bugsTotal,
            "bugs_open" => $bugsOpen,
            "bugs_resolved" => $bugsResolved,
            "bugs_overdue" => $bugsOverdue,
            "bugs_unassigned" => $bugsUnassigned,
            "top_assignees" => $topAssignees
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to load metrics"]);
}
