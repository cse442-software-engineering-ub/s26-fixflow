<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db-connection.php";
require_once __DIR__ . "/notifications-helpers.php";
require_once __DIR__ . "/admin-helpers.php";
require_once __DIR__ . "/bug-id-helpers.php";
require_once __DIR__ . "/fix-details-helpers.php";

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

$id = isset($data["id"]) ? (int)$data["id"] : 0;

if (!$id) {
    echo json_encode(["success" => false, "message" => "id is required"]);
    exit;
}

// Load existing bug
$stmtExisting = $pdo->prepare("SELECT * FROM bugs WHERE id = ?");
$stmtExisting->execute([$id]);
$existing = $stmtExisting->fetch(PDO::FETCH_ASSOC);

if (!$existing) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Bug not found"]);
    exit;
}

if (array_key_exists("title", $data) && trim((string)$data["title"]) === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Title is required"]);
    exit;
}

// Prepare fields to update (partial update)
$fields = [];
$params = [];

if (array_key_exists("title", $data)) {
    $fields[] = "title = :title";
    $params[":title"] = trim($data["title"]);
}
if (array_key_exists("code", $data)) {
    $fields[] = "code = :code";
    $params[":code"] = trim($data["code"]);
}
if (array_key_exists("description", $data)) {
    $fields[] = "description = :description";
    $params[":description"] = trim($data["description"]);
}
if (array_key_exists("priority", $data)) {
    $fields[] = "priority = :priority";
    $params[":priority"] = $data["priority"];
}
if (array_key_exists("dueDate", $data)) {
    $fields[] = "due_date = :due_date";
    $params[":due_date"] = $data["dueDate"];
}
if (array_key_exists("status", $data)) {
    $fields[] = "status = :status";
    $clientStatus = $data["status"];
    $dbStatus = ($clientStatus === "fixed" || $clientStatus === "Resolved" || $clientStatus === "Closed") ? "Resolved" : "Open";
    $params[":status"] = $dbStatus;
}

if (array_key_exists("assignedTo", $data)) {
    $assignedTo = $data["assignedTo"];
    if ($assignedTo === null || $assignedTo === "") {
        $fields[] = "assigned_user_id = NULL";
    } else {
        // Look up user id
        $stmtUser = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmtUser->execute([$assignedTo]);
        $row = $stmtUser->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $fields[] = "assigned_user_id = :assigned_user_id";
            $params[":assigned_user_id"] = (int)$row["id"];
        }
    }
}

if (empty($fields)) {
    echo json_encode(["success" => false, "message" => "No updates provided"]);
    exit;
}

$params[":id"] = $id;

try {
    $sql = "UPDATE bugs SET " . implode(", ", $fields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $actorUserId = (int)$_SESSION["user_id"];
    $actorUsername = (string)($_SESSION["username"] ?? "A teammate");

    // Persist fix details whenever bug is marked fixed; clear them when reopened.
    // This guarantees Bug History can always show "fixed by" and a description.
    $isResolved = ($params[":status"] ?? $existing["status"] ?? "") === "Resolved";
    if ($isResolved) {
        $fixDetailsPayload = null;
        if (isset($data["fixDetails"]) && is_array($data["fixDetails"])) {
            $fixDetailsPayload = $data["fixDetails"];
        } else {
            $fallbackDescription = trim((string)($data["description"] ?? ""));
            if ($fallbackDescription === "") {
                $fallbackDescription = "Bug marked as fixed.";
            }
            $fixDetailsPayload = [
                "description" => $fallbackDescription,
                "fixedBy" => $actorUsername,
                "fixedAt" => gmdate("c"),
            ];
        }
        upsertFixDetails($pdo, $id, $fixDetailsPayload);
    }
    if (array_key_exists("status", $data) && !$isResolved) {
        clearFixDetails($pdo, $id);
    }

    $oldAssignedUserId = isset($existing["assigned_user_id"]) ? (int)$existing["assigned_user_id"] : 0;
    $newAssignedUserId = array_key_exists(":assigned_user_id", $params)
        ? (int)$params[":assigned_user_id"]
        : (int)($existing["assigned_user_id"] ?? 0);
    if (array_key_exists("assignedTo", $data) && ($data["assignedTo"] === null || $data["assignedTo"] === "")) {
        $newAssignedUserId = 0;
    }

    // Assignment changes: notify both new assignee and previous assignee.
    if (array_key_exists("assignedTo", $data) && $newAssignedUserId !== $oldAssignedUserId) {
        if ($newAssignedUserId > 0 && $newAssignedUserId !== $actorUserId) {
            addNotification(
                $pdo,
                $newAssignedUserId,
                $actorUsername,
                $actorUsername . " assigned you bug #" . $id . ": " . ($existing["title"] ?? "Untitled bug"),
                $id
            );
        }

        if ($oldAssignedUserId > 0 && $oldAssignedUserId !== $actorUserId) {
            addNotification(
                $pdo,
                $oldAssignedUserId,
                $actorUsername,
                $actorUsername . " unassigned you from bug #" . $id . ": " . ($existing["title"] ?? "Untitled bug"),
                $id
            );
        }
    }

    // If the bug is assigned to someone else, notify them about relevant changes.
    $updatedRelevantField = array_key_exists("status", $data)
        || array_key_exists("priority", $data)
        || array_key_exists("dueDate", $data)
        || array_key_exists("title", $data);

    if ($updatedRelevantField && $newAssignedUserId > 0 && $newAssignedUserId !== $actorUserId) {
        $verb = "updated";
        if (array_key_exists("status", $data)) {
            $verb = ($params[":status"] ?? "") === "Resolved" ? "marked as fixed" : "updated";
        }
        addNotification(
            $pdo,
            $newAssignedUserId,
            $actorUsername,
            $actorUsername . " " . $verb . " bug #" . $id . ": " . ($data["title"] ?? $existing["title"] ?? "Untitled bug"),
            $id
        );
    }
    logAudit(
        $pdo,
        $actorUserId,
        $actorUsername,
        "bug_update",
        "bug",
        (string)$id,
        json_encode([
            "title" => $data["title"] ?? $existing["title"] ?? "",
            "status" => $params[":status"] ?? null,
            "priority" => $data["priority"] ?? null,
            "assignedTo" => $data["assignedTo"] ?? null
        ])
    );

    // Return updated bug
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
    $stmtBug->execute([$id]);
    $bug = $stmtBug->fetch(PDO::FETCH_ASSOC);

    if (!$bug) {
        $bug = [
            "id"         => $id,
            "title"      => $data["title"] ?? $existing["title"],
            "status"     => $dbStatus ?? $existing["status"],
            "priority"   => $data["priority"] ?? $existing["priority"],
            "created_at" => $existing["created_at"],
            "due_date"   => $data["dueDate"] ?? $existing["due_date"],
            "assignedTo" => null,
            "code"       => $data["code"] ?? ($existing["code"] ?? ""),
            "description"=> $data["description"] ?? ($existing["description"] ?? ""),
        ];
    }

    $bug["bugNumber"] = formatBugNumber(getOrCreateBugNumber($pdo, $id));
    $fixDetails = getFixDetailsForBug($pdo, $id);
    if ($fixDetails !== null) {
        $bug["fixDetails"] = $fixDetails;
        if (isset($fixDetails["fixedAt"])) {
            $bug["fixedAt"] = $fixDetails["fixedAt"];
        }
    }

    echo json_encode(["success" => true, "bug" => $bug]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to update bug"]);
}

