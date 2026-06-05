/**
 * Champion banner is visible on the tournament page only for 48 hours
 * after the tournament was completed. After that, it remains accessible
 * in the "Archives" page.
 */
export const CHAMPION_VISIBILITY_HOURS = 48;

export function isChampionBannerVisible(completedAt?: string | Date | null): boolean {
  if (!completedAt) return true; // if we don't know, default to visible (just completed)
  const completed = new Date(completedAt).getTime();
  const ms = CHAMPION_VISIBILITY_HOURS * 60 * 60 * 1000;
  return Date.now() - completed < ms;
}
