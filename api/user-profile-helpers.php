<?php

/**
 * Ensures users table has avatar columns (idempotent; ignores duplicate-column errors).
 */
function ensureUserAvatarColumns(PDO $pdo): void
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    try {
        if ($driver === "sqlite") {
            $pdo->exec("ALTER TABLE users ADD COLUMN avatar_gradient TEXT NULL");
        } else {
            $pdo->exec("ALTER TABLE users ADD COLUMN avatar_gradient VARCHAR(64) NULL");
        }
    } catch (PDOException $e) {
        // duplicate column
    }
    try {
        if ($driver === "sqlite") {
            $pdo->exec("ALTER TABLE users ADD COLUMN avatar_image TEXT NULL");
        } else {
            $pdo->exec("ALTER TABLE users ADD COLUMN avatar_image MEDIUMTEXT NULL");
        }
    } catch (PDOException $e) {
        // duplicate column
    }
}

/** Max stored custom avatar payload (~2MB file as base64 data URL, with margin). */
const AVATAR_IMAGE_MAX_BYTES = 3500000;

function validateAvatarImagePayload(?string $payload): ?string
{
    if ($payload === null || $payload === "") {
        return null;
    }
    if (strlen($payload) > AVATAR_IMAGE_MAX_BYTES) {
        return "Avatar image is too large";
    }
    if (strpos($payload, "data:image/") !== 0) {
        return "Avatar must be a data URL image (PNG or JPEG)";
    }
    // Allow common browser types; reject svg etc.
    if (
        !preg_match("#^data:image/(jpeg|jpg|png|webp);base64,#i", $payload)
    ) {
        return "Avatar must be PNG, JPEG, or WebP";
    }
    return null;
}
