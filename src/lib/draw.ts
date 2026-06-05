// Tournament draw & match generation utilities — uses circle/Berger method
// to guarantee every team plays every other team exactly once per leg.
import { supabase } from '@/integrations/supabase/client';

export interface DrawTeam { id: string; name: string; logo_url?: string | null; seed?: number | null; }

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Round-robin pairings using the circle method.
 * Returns rounds: each round is an array of [teamA, teamB] pairs.
 * If team count is odd, one team gets a BYE per round (skipped from output).
 */
export function roundRobinRounds<T>(teams: T[]): Array<Array<[T, T]>> {
  const arr: (T | null)[] = [...teams];
  if (arr.length % 2 === 1) arr.push(null);
  const n = arr.length;
  const rounds: Array<Array<[T, T]>> = [];
  const working = [...arr];

  for (let r = 0; r < n - 1; r++) {
    const round: Array<[T, T]> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = working[i];
      const b = working[n - 1 - i];
      if (a && b) round.push([a, b]);
    }
    rounds.push(round);
    // rotate keeping first fixed
    const fixed = working[0];
    const rest = working.slice(1);
    rest.unshift(rest.pop()!);
    working.length = 0;
    working.push(fixed!, ...rest);
  }
  return rounds;
}

/** Flat list of all unique pairings (used for display counts). */
export function roundRobin<T>(teams: T[]): Array<[T, T]> {
  return roundRobinRounds(teams).flat();
}

/** Knockout first round: pair teams 1↔last, 2↔last-1, ... handles BYE when odd. */
export function knockoutFirstRound<T>(teams: T[]): Array<[T | null, T | null]> {
  const arr: (T | null)[] = [...teams];
  let size = 1;
  while (size < arr.length) size *= 2;
  while (arr.length < size) arr.push(null);
  const pairs: Array<[T | null, T | null]> = [];
  for (let i = 0; i < arr.length / 2; i++) {
    pairs.push([arr[i], arr[arr.length - 1 - i]]);
  }
  return pairs;
}

export async function clearTournamentMatches(tournamentId: string) {
  await supabase.from('matches').delete().eq('tournament_id', tournamentId);
  await supabase.from('standings').delete().eq('tournament_id', tournamentId);
}

export async function generateAllMatches(opts: {
  tournamentId: string;
  type: 'knockout' | 'league' | 'groups';
  teams: DrawTeam[];
  legs?: number;
  groups?: Record<string, DrawTeam[]>;
}) {
  const { tournamentId, type, teams, legs = 1, groups } = opts;
  if (teams.length < 2) throw new Error('عدد الفرق غير كافٍ');

  await clearTournamentMatches(tournamentId);

  if (type === 'knockout') {
    const pairs = knockoutFirstRound(teams);
    const rows = pairs.map((p, i) => ({
      tournament_id: tournamentId,
      home_team_id: p[0]?.id || null,
      away_team_id: p[1]?.id || null,
      round: 1,
      match_order: i + 1,
      status: 'scheduled' as const,
      stage: 'knockout',
    }));
    if (rows.length) await supabase.from('matches').insert(rows);
    return rows.length;
  }

  if (type === 'league') {
    await supabase.from('standings').insert(
      teams.map((t, i) => ({
        tournament_id: tournamentId, team_id: t.id, position: i + 1,
        played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0,
      })),
    );
    const rounds = roundRobinRounds(teams);
    const rows: any[] = [];
    let order = 1;
    for (let leg = 1; leg <= legs; leg++) {
      rounds.forEach((round, rIdx) => {
        round.forEach(([a, b]) => {
          rows.push({
            tournament_id: tournamentId,
            home_team_id: leg === 1 ? a.id : b.id,
            away_team_id: leg === 1 ? b.id : a.id,
            round: (leg - 1) * rounds.length + rIdx + 1,
            match_order: order++,
            status: 'scheduled' as const,
            stage: 'league', leg,
          });
        });
      });
    }
    if (rows.length) await supabase.from('matches').insert(rows);
    return rows.length;
  }

  // groups
  if (!groups) throw new Error('No groups provided');
  const allMatches: any[] = [];
  const allStandings: any[] = [];
  let order = 1;
  for (const [groupName, groupTeams] of Object.entries(groups)) {
    await Promise.all(groupTeams.map(t =>
      supabase.from('teams').update({ group_name: groupName }).eq('id', t.id),
    ));
    groupTeams.forEach((t, i) => allStandings.push({
      tournament_id: tournamentId, team_id: t.id, group_name: groupName, position: i + 1,
      played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0,
    }));
    const rounds = roundRobinRounds(groupTeams);
    rounds.forEach((round, rIdx) => {
      round.forEach(([a, b]) => {
        allMatches.push({
          tournament_id: tournamentId,
          home_team_id: a.id, away_team_id: b.id,
          round: rIdx + 1, match_order: order++,
          status: 'scheduled' as const,
          group_name: groupName, stage: 'group',
        });
      });
    });
  }
  if (allStandings.length) await supabase.from('standings').insert(allStandings);
  if (allMatches.length) await supabase.from('matches').insert(allMatches);
  return allMatches.length;
}

/** Distribute teams into N groups (snake order for fairness). */
export function distributeIntoGroups<T>(teams: T[], numGroups: number): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (let i = 0; i < numGroups; i++) groups[String.fromCharCode(65 + i)] = [];
  const letters = Object.keys(groups);
  teams.forEach((t, i) => {
    const row = Math.floor(i / numGroups);
    const col = row % 2 === 0 ? i % numGroups : numGroups - 1 - (i % numGroups);
    groups[letters[col]].push(t);
  });
  return groups;
}

/**
 * After group stage completes, generate the knockout bracket using qualifiers per group.
 * Picks the top N from each group by points/GD/GF and creates first-round knockout matches.
 */
export async function generateKnockoutFromGroups(opts: {
  tournamentId: string;
  qualifiersPerGroup: number;
}) {
  const { tournamentId, qualifiersPerGroup } = opts;
  const { data: standings } = await supabase
    .from('standings').select('*').eq('tournament_id', tournamentId);
  if (!standings?.length) throw new Error('لا يوجد ترتيب');

  // sort within each group
  const byGroup: Record<string, any[]> = {};
  for (const s of standings) {
    const g = s.group_name || 'A';
    (byGroup[g] ||= []).push(s);
  }
  for (const g of Object.keys(byGroup)) {
    byGroup[g].sort((a, b) =>
      (b.points || 0) - (a.points || 0) ||
      (b.goal_difference || 0) - (a.goal_difference || 0) ||
      (b.goals_for || 0) - (a.goals_for || 0));
  }

  // collect qualifiers
  const qualifiers: string[] = [];
  for (const g of Object.keys(byGroup).sort()) {
    qualifiers.push(...byGroup[g].slice(0, qualifiersPerGroup).map(s => s.team_id));
  }
  if (qualifiers.length < 2) throw new Error('عدد المتأهلين غير كافٍ');

  // Determine next round number
  const { data: last } = await supabase.from('matches').select('round')
    .eq('tournament_id', tournamentId).order('round', { ascending: false }).limit(1);
  const nextRound = ((last?.[0]?.round) || 0) + 1;

  // Pair 1-last, 2-secondLast, etc. (cross-group: first of A vs second of B is common)
  const rows: any[] = [];
  for (let i = 0; i < Math.floor(qualifiers.length / 2); i++) {
    rows.push({
      tournament_id: tournamentId,
      home_team_id: qualifiers[i],
      away_team_id: qualifiers[qualifiers.length - 1 - i],
      round: nextRound, match_order: i + 1,
      status: 'scheduled' as const, stage: 'knockout',
    });
  }
  if (rows.length) await supabase.from('matches').insert(rows);
  return rows.length;
}

/** Short alphanumeric tournament join code, ~8 chars. */
export function generateJoinCode(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * After a league finishes, build a knockout bracket from the final standings.
 * Picks the top N (largest power of two ≤ team count, optionally capped by topN)
 * and seeds 1↔last, 2↔(last-1)…
 */
export async function generateKnockoutFromLeague(opts: {
  tournamentId: string;
  topN?: number;
}) {
  const { tournamentId, topN } = opts;
  const { data: standings } = await supabase
    .from('standings').select('*').eq('tournament_id', tournamentId);
  if (!standings?.length) throw new Error('لا يوجد ترتيب');

  const sorted = [...standings].sort((a, b) =>
    (b.points || 0) - (a.points || 0) ||
    (b.goal_difference || 0) - (a.goal_difference || 0) ||
    (b.goals_for || 0) - (a.goals_for || 0));

  let n = 1;
  while (n * 2 <= sorted.length) n *= 2;
  if (topN && topN >= 2) { let cap = 1; while (cap * 2 <= topN) cap *= 2; n = Math.min(n, cap); }
  if (n < 2) throw new Error('عدد المتأهلين غير كافٍ');

  const qualifiers = sorted.slice(0, n).map((s: any) => s.team_id);

  const { data: last } = await supabase.from('matches').select('round')
    .eq('tournament_id', tournamentId).order('round', { ascending: false }).limit(1);
  const nextRound = ((last?.[0]?.round) || 0) + 1;

  const rows: any[] = [];
  for (let i = 0; i < qualifiers.length / 2; i++) {
    rows.push({
      tournament_id: tournamentId,
      home_team_id: qualifiers[i],
      away_team_id: qualifiers[qualifiers.length - 1 - i],
      round: nextRound, match_order: i + 1,
      status: 'scheduled' as const, stage: 'knockout',
    });
  }
  if (rows.length) await supabase.from('matches').insert(rows);
  return rows.length;
}
