<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/notifications-helpers.php";
require_once __DIR__ . "/admin-helpers.php";
require_once __DIR__ . "/bug-id-helpers.php";

if (!isset($_SESSION["user_id"]) || !is_numeric($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true) ?? [];

$title       = trim($data["title"] ?? "");
$code        = trim($data["code"] ?? "");
$priority    = $data["priority"] ?? "medium";
$dueDate     = $data["dueDate"] ?? null;
$description = trim($data["description"] ?? "");
$status      = $data["status"] ?? "active";
$assignedTo  = $data["assignedTo"] ?? null; // username or null

if ($title === "" || $code === "" || $description === "" || !$dueDate) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

// Map assigned username to user id, if provided
$assignedUserId = null;
if ($assignedTo !== null && $assignedTo !== "") {
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmtUser->execute([$assignedTo]);
    $row = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $assignedUserId = (int)$row["id"];
    }
}

// Map frontend status ("active"/"fixed") to DB status ("Open"/"Resolved")
$dbStatus = ($status === "fixed" || $status === "Resolved" || $status === "Closed") ? "Resolved" : "Open";

try {
    // Insert bug (now also persisting code and description)
    $now = date("Y-m-d H:i:s");
    $stmt = $pdo->prepare("
        INSERT INTO bugs (title, status, priority, created_at, due_date, assigned_user_id, code, description)
        VALUES (:title, :status, :priority, :created_at, :due_date, :assigned_user_id, :code, :description)
    ");

    $stmt->execute([
        ":title"           => $title,
        ":status"          => $dbStatus,
        ":priority"        => $priority,
        ":created_at"      => $now,
        ":due_date"        => $dueDate,
        ":assigned_user_id"=> $assignedUserId,
        ":code"            => $code,
        ":description"     => $description,
    ]);

    $newId = (int)$pdo->lastInsertId();
    $bugNumberInt = getOrCreateBugNumber($pdo, $newId);

    $actorUserId = (int)$_SESSION["user_id"];
    $actorUsername = (string)($_SESSION["username"] ?? "A teammate");
    if ($assignedUserId !== null && $assignedUserId !== $actorUserId) {
        addNotification(
            $pdo,
            (int)$assignedUserId,
            $actorUsername,
            $actorUsername . " assigned you bug #" . $newId . ": " . $title,
            $newId
        );
    }
    logAudit(
        $pdo,
        $actorUserId,
        $actorUsername,
        "bug_create",
        "bug",
        (string)$newId,
        json_encode(["title" => $title, "assignedTo" => $assignedTo])
    );

    // Return the newly created bug (with code/description attached from the request)
    $stmtBug = $pdo->prepare("
        SELECT 
            b.id,
            b.title,
            b.status,
            b.priority,
            b.created_at,
            b.due_date,
            u.username AS assignedTo,
            b.code,
            b.description
        FROM bugs b
        LEFT JOIN users u ON b.assigned_user_id = u.id
        WHERE b.id = ?
    ");
    $stmtBug->execute([$newId]);
    $bug = $stmtBug->fetch(PDO::FETCH_ASSOC);

    if (!$bug) {
        $bug = [
            "id"         => $newId,
            "title"      => $title,
            "status"     => $dbStatus,
            "priority"   => $priority,
            "created_at" => $now,
            "due_date"   => $dueDate,
            "assignedTo" => $assignedTo,
        ];
    }

    // Attach code and description so the frontend can display them
    $bug["code"] = $code;
    $bug["description"] = $description;
    $bug["bugNumber"] = formatBugNumber($bugNumberInt);

    echo json_encode(["success" => true, "bug" => $bug]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to create bug"]);
}
//added backend sql code for edit bug UI in phpMyAdmin (no changes in php files were required)
