export const XP_PER_PROFILE_LEVEL = 250;

/**
 * Profile level is derived from accumulated XP so every API payload presents
 * the same level after XP changes.
 */
export function levelForXp(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  return Math.max(1, Math.floor(xp / XP_PER_PROFILE_LEVEL) + 1);
}
