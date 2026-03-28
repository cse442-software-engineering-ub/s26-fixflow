/** Must match server default in api/me.php when avatar_gradient is unset. */
export const DEFAULT_AVATAR_GRADIENT_ID = 'gradient-blue';

/** Self-facing label: display name when set, otherwise login username. */
export function displayNameForSelf(
  fullName: string | null | undefined,
  username: string
): string {
  const t = fullName?.trim();
  return t || username;
}

export function normalizeAvatarGradientId(
  gradient: string | null | undefined
): string {
  const g = gradient?.trim();
  return g || DEFAULT_AVATAR_GRADIENT_ID;
}

/** Custom upload takes precedence in UI when present (persisted data URL). */
export function isPersistedCustomAvatar(
  image: string | null | undefined
): image is string {
  return typeof image === 'string' && image.startsWith('data:image/');
}
