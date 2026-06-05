/**
 * Volleyball scoring helpers.
 *
 * Formats:
 *  - "best_of_5" → first to 3 sets wins (5 sets max). Sets 1-4 to 25, set 5 to 15. Win by 2.
 *  - "best_of_3" → first to 2 sets wins (3 sets max). Sets 1-2 to 25, set 3 to 15.
 *
 * League points (FIVB standard, also used here for both formats):
 *  - 3-0 / 3-1 (or 2-0)  → winner 3 pts, loser 0
 *  - 3-2 (or 2-1, deciding set close) → winner 2 pts, loser 1
 */

export type VolleyballFormat = 'best_of_3' | 'best_of_5';

export interface VolleyballSet {
  home: number;
  away: number;
}

export const setsToWin = (format?: string | null): number =>
  format === 'best_of_3' ? 2 : 3;

export const maxSets = (format?: string | null): number =>
  format === 'best_of_3' ? 3 : 5;

export function countSetsWon(sets: VolleyballSet[]): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const s of sets) {
    if (typeof s.home !== 'number' || typeof s.away !== 'number') continue;
    if (s.home === 0 && s.away === 0) continue;
    if (s.home > s.away) home++;
    else if (s.away > s.home) away++;
  }
  return { home, away };
}

/**
 * Returns the points awarded to home & away based on set tally.
 * Used when computing standings for volleyball tournaments.
 */
export function volleyballPoints(homeSets: number, awaySets: number): { home: number; away: number } {
  if (homeSets === 0 && awaySets === 0) return { home: 0, away: 0 };
  // Close match (one set difference at the maximum) → 2/1
  const isClose =
    (homeSets === 3 && awaySets === 2) ||
    (awaySets === 3 && homeSets === 2) ||
    (homeSets === 2 && awaySets === 1) ||
    (awaySets === 2 && homeSets === 1);
  if (isClose) {
    return homeSets > awaySets ? { home: 2, away: 1 } : { home: 1, away: 2 };
  }
  // Decisive win → 3/0
  return homeSets > awaySets ? { home: 3, away: 0 } : { home: 0, away: 3 };
}

export function isVolleyballMatchComplete(sets: VolleyballSet[], format?: string | null): boolean {
  const need = setsToWin(format);
  const { home, away } = countSetsWon(sets);
  return home >= need || away >= need;
}
