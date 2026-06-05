/**
 * Algerian official age categories.
 * Reference age = (current year - birth year). The "max" is inclusive.
 */
export type AgeCategoryKey = 'u13' | 'u15' | 'u17' | 'u19' | 'senior';

export interface AgeCategory {
  key: AgeCategoryKey;
  arLabel: string;
  frLabel: string;
  maxAge: number; // null/Infinity = senior
}

export const AGE_CATEGORIES: AgeCategory[] = [
  { key: 'u13',    arLabel: 'أشبال (U13)',   frLabel: 'Poussins (U13)',   maxAge: 12 },
  { key: 'u15',    arLabel: 'أصاغر (U15)',   frLabel: 'Minimes (U15)',    maxAge: 14 },
  { key: 'u17',    arLabel: 'أواسط (U17)',   frLabel: 'Cadets (U17)',     maxAge: 16 },
  { key: 'u19',    arLabel: 'آمال (U19)',    frLabel: 'Juniors (U19)',    maxAge: 18 },
  { key: 'senior', arLabel: 'أكابر',          frLabel: 'Seniors',          maxAge: 99 },
];

export function getCategory(key?: string | null) {
  if (!key) return null;
  return AGE_CATEGORIES.find(c => c.key === key) || null;
}

export function getCategoryLabel(key: string | null | undefined, lang: string) {
  const cat = getCategory(key);
  if (!cat) return '';
  return lang === 'fr' ? cat.frLabel : cat.arLabel;
}

export function ageFromBirthDate(birthDate: string | Date): number {
  const d = new Date(birthDate);
  const now = new Date();
  return now.getFullYear() - d.getFullYear();
}

export function isPlayerEligible(birthDate: string | Date, categoryKey: string): boolean {
  const cat = getCategory(categoryKey);
  if (!cat) return true;
  const age = ageFromBirthDate(birthDate);
  return age <= cat.maxAge;
}

export function currentSeason(): string {
  // Sport season: e.g. 2025/2026 starting in August
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  if (m >= 7) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}
