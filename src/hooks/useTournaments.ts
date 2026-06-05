import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/i18n';
import { volleyballPoints, type VolleyballSet } from '@/lib/volleyball';

const t = (k: string, opts?: Record<string, unknown>) => i18n.t(k, opts) as string;

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type TournamentType = Database['public']['Enums']['tournament_type'];
type TournamentStatus = Database['public']['Enums']['tournament_status'];
type SportType = Database['public']['Enums']['sport_type'];

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({ title: t('common.error'), description: t('toasts.fetchTournamentsFailed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (tournament: {
    name: string;
    type: TournamentType;
    startDate: string;
    numTeams: number;
    numGroups?: number;
    teamsPerGroup?: number;
    logoUrl?: string | null;
    venueName?: string;
    venueAddress?: string;
    refereeName?: string;
    acceptJoinRequests?: boolean;
    maxTeams?: number;
    venuePhotos?: string[];
    sportType?: string;
    ageCategory?: string;
    volleyballFormat?: string;
    season?: string;
    leagueLegs?: number;
    hasPlayoff?: boolean;
    playoffTeams?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: tournament.name,
          type: tournament.type,
          status: 'draft' as TournamentStatus,
          start_date: tournament.startDate || null,
          num_teams: tournament.numTeams,
          num_groups: tournament.numGroups || 4,
          teams_per_group: tournament.teamsPerGroup || 4,
          owner_id: user?.id || null,
          logo_url: tournament.logoUrl || null,
          venue_name: tournament.venueName || null,
          venue_address: tournament.venueAddress || null,
          referee_name: tournament.refereeName || null,
          accept_join_requests: false,
          max_teams: tournament.maxTeams || null,
          venue_photos: tournament.venuePhotos || [],
          sport_type: (tournament.sportType as any) || 'football',
          age_category: tournament.ageCategory || null,
          volleyball_format: tournament.volleyballFormat || null,
          season: tournament.season || null,
          league_legs: tournament.leagueLegs ?? 1,
          has_playoff: tournament.hasPlayoff ?? false,
          playoff_teams: tournament.playoffTeams ?? 4,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setTournaments((prev) => [data, ...prev]);
      toast({ title: t('common.success'), description: t('toasts.tournamentCreated') });
      return data;
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({ title: t('common.error'), description: t('toasts.createTournamentFailed'), variant: 'destructive' });
      return null;
    }
  };

  const createLeagueTournamentWithTeams = async (tournament: {
    name: string;
    startDate: string;
    teamNames: string[];
    logoUrl?: string | null;
    venueName?: string;
    venueAddress?: string;
    refereeName?: string;
    venuePhotos?: string[];
    sportType?: SportType;
    ageCategory?: string;
    volleyballFormat?: string;
    season?: string;
    leagueLegs?: 1 | 2;
    hasPlayoff?: boolean;
    playoffTeams?: 4 | 8;
  }) => {
    try {
      const { data: tournamentId, error } = await supabase.rpc('create_league_tournament_full', {
        p_name: tournament.name,
        p_start_date: tournament.startDate || null,
        p_team_names: tournament.teamNames,
        p_owner_id: user?.id || null,
        p_logo_url: tournament.logoUrl || null,
        p_venue_name: tournament.venueName || null,
        p_venue_address: tournament.venueAddress || null,
        p_referee_name: tournament.refereeName || null,
        p_venue_photos: tournament.venuePhotos || [],
        p_sport_type: tournament.sportType || 'football',
        p_age_category: tournament.ageCategory || null,
        p_volleyball_format: tournament.volleyballFormat || null,
        p_season: tournament.season || null,
        p_league_legs: tournament.leagueLegs ?? 1,
        p_has_playoff: tournament.hasPlayoff ?? false,
        p_playoff_teams: tournament.playoffTeams ?? 4,
      });

      if (error) throw error;

      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (fetchError) throw fetchError;
      setTournaments((prev) => [data, ...prev]);
      toast({ title: t('common.success'), description: t('toasts.leagueCreated', { count: tournament.teamNames.length, defaultValue: 'تم إنشاء الدوري وجدوله بنجاح' }) });
      return data;
    } catch (error: any) {
      console.error('Error creating league tournament:', error);
      toast({ title: t('common.error'), description: error.message || t('toasts.createTournamentFailed'), variant: 'destructive' });
      return null;
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await supabase.from('standings').delete().eq('tournament_id', tournamentId);
      await supabase.from('matches').delete().eq('tournament_id', tournamentId);
      await supabase.from('teams').delete().eq('tournament_id', tournamentId);
      await supabase.from('join_requests').delete().eq('tournament_id', tournamentId);

      const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
      if (error) throw error;

      setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
      toast({ title: t('toasts.tournamentDeleted') });
      return true;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({ title: t('common.error'), description: t('toasts.deleteTournamentFailed'), variant: 'destructive' });
      return false;
    }
  };

  const addTeams = async (tournamentId: string, teamNames: string[]) => {
    try {
      const teams = teamNames.map((name, index) => ({
        tournament_id: tournamentId,
        name,
        seed: index + 1,
      }));
      const { data, error } = await supabase.from('teams').insert(teams).select();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding teams:', error);
      toast({ title: t('common.error'), description: t('toasts.addTeamsFailed'), variant: 'destructive' });
      return null;
    }
  };

  const performAIDraw = async (teams: string[], tournamentType: TournamentType, numGroups?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-draw', {
        body: { teams, tournamentType, numGroups },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error performing AI draw:', error);
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      if (tournamentType === 'groups' && numGroups) {
        const groups: Record<string, string[]> = {};
        const perGroup = Math.ceil(shuffled.length / numGroups);
        for (let i = 0; i < numGroups; i++) {
          const letter = String.fromCharCode(65 + i);
          groups[letter] = shuffled.slice(i * perGroup, (i + 1) * perGroup);
        }
        return { groups };
      }
      return { draw: shuffled };
    }
  };

  const generateKnockoutMatches = async (tournamentId: string, teams: Team[]) => {
    try {
      if (!teams || teams.length < 2) {
        throw new Error(t('toasts.minTwoTeams'));
      }

      const matches = [];
      const numMatches = Math.floor(teams.length / 2);

      for (let i = 0; i < numMatches; i++) {
        matches.push({
          tournament_id: tournamentId,
          home_team_id: teams[i * 2].id,
          away_team_id: teams[i * 2 + 1].id,
          round: 1,
          match_order: i + 1,
          status: 'scheduled' as const,
        });
      }

      const { data, error } = await supabase.from('matches').insert(matches).select();
      if (error) throw error;

      await supabase.from('tournaments').update({ status: 'active' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: t('common.success'), description: t('toasts.knockoutCreated') });
      return data;
    } catch (error) {
      console.error('Error generating knockout matches:', error);
      toast({ title: t('common.error'), description: t('toasts.createMatchesFailed'), variant: 'destructive' });
      return null;
    }
  };

  const generateGroupMatches = async (tournamentId: string, teams: Team[], groups: Record<string, string[]>) => {
    try {
      const allStandings: any[] = [];
      const allMatches: any[] = [];
      let matchOrder = 1;

      for (const [groupName, groupTeamNames] of Object.entries(groups)) {
        const groupTeams = groupTeamNames
          .map(name => teams.find(t => t.name === name))
          .filter(Boolean) as Team[];

        for (const team of groupTeams) {
          await supabase.from('teams').update({ group_name: groupName }).eq('id', team.id);
        }

        groupTeams.forEach((team, index) => {
          allStandings.push({
            tournament_id: tournamentId,
            team_id: team.id,
            group_name: groupName,
            position: index + 1,
            played: 0, won: 0, drawn: 0, lost: 0,
            goals_for: 0, goals_against: 0, points: 0,
          });
        });

        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            allMatches.push({
              tournament_id: tournamentId,
              home_team_id: groupTeams[i].id,
              away_team_id: groupTeams[j].id,
              round: 1,
              match_order: matchOrder++,
              status: 'scheduled' as const,
              group_name: groupName,
            });
          }
        }
      }

      if (allStandings.length > 0) {
        const { error: standingsError } = await supabase.from('standings').insert(allStandings);
        if (standingsError) throw standingsError;
      }

      if (allMatches.length > 0) {
        const { error: matchesError } = await supabase.from('matches').insert(allMatches);
        if (matchesError) throw matchesError;
      }

      await supabase.from('tournaments').update({ status: 'active' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: t('toasts.groupsCreated'), description: t('toasts.groupsCreatedDesc', { count: allMatches.length }) });
      return true;
    } catch (error) {
      console.error('Error generating group matches:', error);
      toast({ title: t('common.error'), description: t('toasts.createGroupsFailed'), variant: 'destructive' });
      return null;
    }
  };

  const startKnockoutFromGroups = async (tournamentId: string) => {
    try {
      const { data: groupMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .not('group_name', 'is', null);

      if (groupMatches && groupMatches.length > 0) {
        const incompleteGroupMatches = groupMatches.filter(m => m.status !== 'completed');
        if (incompleteGroupMatches.length > 0) {
          toast({ title: t('toasts.warning'), description: t('toasts.incompleteGroupMatches', { count: incompleteGroupMatches.length }), variant: 'destructive' });
          return null;
        }
      }

      const { data: standings } = await supabase
        .from('standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('group_name')
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false });

      if (!standings || standings.length === 0) {
        throw new Error(t('toasts.noMatches'));
      }

      const grouped: Record<string, typeof standings> = {};
      for (const s of standings) {
        const key = s.group_name || 'A';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      }

      for (const key of Object.keys(grouped)) {
        grouped[key].sort((a, b) => {
          const pointsDiff = (b.points || 0) - (a.points || 0);
          if (pointsDiff !== 0) return pointsDiff;
          return (b.goal_difference || 0) - (a.goal_difference || 0);
        });
      }

      const sortedGroups = Object.keys(grouped).sort();

      const firsts: string[] = [];
      const seconds: string[] = [];
      for (const groupName of sortedGroups) {
        const grp = grouped[groupName];
        if (grp[0]) firsts.push(grp[0].team_id);
        if (grp[1]) seconds.push(grp[1].team_id);
      }

      if (firsts.length === 0 || seconds.length === 0) {
        throw new Error(t('toasts.startKnockoutFailed'));
      }

      const { data: existingMatches } = await supabase
        .from('matches')
        .select('round')
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: false })
        .limit(1);

      const nextRound = existingMatches && existingMatches.length > 0
        ? (existingMatches[0].round || 1) + 1
        : 2;

      const matches = [];
      const reversedSeconds = [...seconds].reverse();

      for (let i = 0; i < Math.min(firsts.length, reversedSeconds.length); i++) {
        matches.push({
          tournament_id: tournamentId,
          home_team_id: firsts[i],
          away_team_id: reversedSeconds[i],
          round: nextRound,
          match_order: i + 1,
          status: 'scheduled' as const,
        });
      }

      if (matches.length > 0) {
        const { error } = await supabase.from('matches').insert(matches);
        if (error) throw error;
      }

      await supabase.from('tournaments').update({ status: 'live' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: t('toasts.knockoutStarted'), description: t('toasts.knockoutStartedDesc', { count: matches.length }) });
      return true;
    } catch (error: any) {
      console.error('Error starting knockout from groups:', error);
      toast({ title: t('common.error'), description: error.message || t('toasts.startKnockoutFailed'), variant: 'destructive' });
      return null;
    }
  };

  const updateStandings = async (
    tournamentId: string,
    homeTeamId: string,
    awayTeamId: string,
    homeScore: number,
    awayScore: number,
    sportType: string = 'football',
  ) => {
    try {
      const { data: homeSt } = await supabase
        .from('standings').select('*').eq('tournament_id', tournamentId).eq('team_id', homeTeamId).single();
      const { data: awaySt } = await supabase
        .from('standings').select('*').eq('tournament_id', tournamentId).eq('team_id', awayTeamId).single();

      // Compute points awarded based on sport
      let homePts: number;
      let awayPts: number;
      if (sportType === 'volleyball') {
        const p = volleyballPoints(homeScore, awayScore);
        homePts = p.home;
        awayPts = p.away;
      } else {
        // Football / basketball / default: win=3, draw=1, loss=0
        const homeWon = homeScore > awayScore;
        const awayWon = awayScore > homeScore;
        const draw = homeScore === awayScore;
        homePts = homeWon ? 3 : draw ? 1 : 0;
        awayPts = awayWon ? 3 : draw ? 1 : 0;
      }

      if (homeSt) {
        const won = homeScore > awayScore ? 1 : 0;
        const drawn = homeScore === awayScore ? 1 : 0;
        const lost = homeScore < awayScore ? 1 : 0;
        await supabase.from('standings').update({
          played: (homeSt.played || 0) + 1, won: (homeSt.won || 0) + won,
          drawn: (homeSt.drawn || 0) + drawn, lost: (homeSt.lost || 0) + lost,
          goals_for: (homeSt.goals_for || 0) + homeScore, goals_against: (homeSt.goals_against || 0) + awayScore,
          points: (homeSt.points || 0) + homePts,
        }).eq('id', homeSt.id);
      }

      if (awaySt) {
        const won = awayScore > homeScore ? 1 : 0;
        const drawn = homeScore === awayScore ? 1 : 0;
        const lost = awayScore < homeScore ? 1 : 0;
        await supabase.from('standings').update({
          played: (awaySt.played || 0) + 1, won: (awaySt.won || 0) + won,
          drawn: (awaySt.drawn || 0) + drawn, lost: (awaySt.lost || 0) + lost,
          goals_for: (awaySt.goals_for || 0) + awayScore, goals_against: (awaySt.goals_against || 0) + homeScore,
          points: (awaySt.points || 0) + awayPts,
        }).eq('id', awaySt.id);
      }
    } catch (error) {
      console.error('Error updating standings:', error);
    }
  };

  const updateMatchResult = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    manOfMatchName?: string,
    sets?: VolleyballSet[],
  ) => {
    try {
      const { data: match, error: fetchError } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (fetchError) throw fetchError;

      // Look up tournament's sport for correct standings logic
      const { data: tournamentRow } = await supabase
        .from('tournaments').select('sport_type').eq('id', match.tournament_id).maybeSingle();
      const sportType = (tournamentRow as any)?.sport_type || 'football';

      const winnerId = homeScore > awayScore ? match.home_team_id : homeScore < awayScore ? match.away_team_id : null;

      const updateData: any = { home_score: homeScore, away_score: awayScore, status: 'completed' as const, winner_id: winnerId };
      // man_of_match stored inside scorers JSONB if provided
      if (manOfMatchName) {
        const prev = (match as any).scorers || [];
        updateData.scorers = [...prev, { name: manOfMatchName, role: 'mom' }];
      }
      if (sportType === 'volleyball' && sets) {
        updateData.home_sets = homeScore;
        updateData.away_sets = awayScore;
        updateData.sets_json = sets as any;
      }

      const { error: updateError } = await supabase.from('matches').update(updateData).eq('id', matchId);
      if (updateError) throw updateError;

      if (match.home_team_id && match.away_team_id) {
        const { data: homeSt } = await supabase
          .from('standings').select('*').eq('tournament_id', match.tournament_id).eq('team_id', match.home_team_id).maybeSingle();
        if (homeSt) {
          await updateStandings(match.tournament_id, match.home_team_id, match.away_team_id, homeScore, awayScore, sportType);
        }
      }

      if (match.stage !== 'league' && !match.group_name && winnerId) {
        const { data: roundMatches } = await supabase.from('matches')
          .select('*').eq('tournament_id', match.tournament_id).eq('round', match.round).is('group_name', null);

        if (roundMatches) {
          const updatedRoundMatches = roundMatches.map(m => m.id === matchId ? { ...m, status: 'completed' as const, winner_id: winnerId } : m);
          const allCompleted = updatedRoundMatches.every(m => m.status === 'completed');
          const winners = updatedRoundMatches.map(m => m.winner_id).filter(Boolean) as string[];

          if (allCompleted && winners.length >= 2) {
            const nextRound = (match.round || 1) + 1;
            const nextMatches = [];
            for (let i = 0; i < winners.length; i += 2) {
              if (winners[i + 1]) {
                nextMatches.push({
                  tournament_id: match.tournament_id,
                  home_team_id: winners[i],
                  away_team_id: winners[i + 1],
                  round: nextRound,
                  match_order: Math.floor(i / 2) + 1,
                  status: 'scheduled' as const,
                });
              }
            }
            if (nextMatches.length > 0) {
              await supabase.from('matches').insert(nextMatches);
              toast({ title: t('toasts.nextRoundCreated'), description: t('toasts.nextRoundCreatedDesc', { count: nextMatches.length }) });
            } else if (winners.length === 1) {
              await supabase.from('tournaments').update({ status: 'completed' as TournamentStatus }).eq('id', match.tournament_id);
              toast({ title: t('toasts.tournamentEnded'), description: t('toasts.tournamentEndedDesc') });
            }
          } else if (allCompleted && winners.length === 1) {
            await supabase.from('tournaments').update({ status: 'completed' as TournamentStatus }).eq('id', match.tournament_id);
            toast({ title: t('toasts.tournamentEnded'), description: t('toasts.tournamentEndedDesc') });
          }
        }
      }

      toast({ title: t('toasts.resultUpdated'), description: `${homeScore} - ${awayScore}` });
      return true;
    } catch (error) {
      console.error('Error updating match result:', error);
      toast({ title: t('common.error'), description: t('toasts.updateResultFailed'), variant: 'destructive' });
      return null;
    }
  };

  /**
   * Generate full Round-Robin schedule for a league using the circle method.
   * legs = 1 (single round-robin) or 2 (double round-robin: home & away).
   * Each leg fills (n-1) rounds (or n rounds if odd, with a BYE skipped).
   */
  const generateLeagueMatches = async (tournamentId: string, teams: Team[], legs: number = 1) => {
    try {
      if (!teams || teams.length < 2) {
        throw new Error(t('toasts.minTwoTeams'));
      }

      // Use circle method. Add a BYE placeholder if odd number of teams.
      const arr: (Team | null)[] = [...teams];
      if (arr.length % 2 === 1) arr.push(null);
      const n = arr.length;
      const roundsPerLeg = n - 1;

      // Initialize standings
      const standingsRows = teams.map((team, index) => ({
        tournament_id: tournamentId,
        team_id: team.id,
        position: index + 1,
        played: 0, won: 0, drawn: 0, lost: 0,
        goals_for: 0, goals_against: 0, points: 0,
      }));
      if (standingsRows.length > 0) {
        const { error: stErr } = await supabase.from('standings').insert(standingsRows);
        if (stErr) throw stErr;
      }

      const allMatches: any[] = [];
      let matchOrder = 1;

      // Working array we rotate (keep position 0 fixed, rotate the rest)
      const working = [...arr];

      for (let leg = 1; leg <= legs; leg++) {
        // Reset working at the start of each leg so home/away pairings repeat (with sides flipped on leg 2)
        const w = [...arr];
        for (let r = 0; r < roundsPerLeg; r++) {
          for (let i = 0; i < n / 2; i++) {
            const a = w[i];
            const b = w[n - 1 - i];
            if (!a || !b) continue;
            const home = leg === 2 ? b : a;
            const away = leg === 2 ? a : b;
            allMatches.push({
              tournament_id: tournamentId,
              home_team_id: home.id,
              away_team_id: away.id,
              round: (leg - 1) * roundsPerLeg + r + 1,
              match_order: matchOrder++,
              status: 'scheduled' as const,
              leg,
            });
          }
          // rotate (keep first fixed)
          const fixed = w[0];
          const rest = w.slice(1);
          rest.unshift(rest.pop() as any);
          w.splice(0, w.length, fixed as any, ...rest);
        }
      }

      if (allMatches.length > 0) {
        const { error: mErr } = await supabase.from('matches').insert(allMatches);
        if (mErr) throw mErr;
      }

      await supabase.from('tournaments').update({ status: 'active' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: t('common.success'), description: t('toasts.leagueCreated', { count: allMatches.length, defaultValue: 'تم إنشاء جدول الدوري ({{count}} مباراة)' }) });
      return true;
    } catch (error: any) {
      console.error('Error generating league matches:', error);
      toast({ title: t('common.error'), description: error.message || t('toasts.createMatchesFailed'), variant: 'destructive' });
      return null;
    }
  };

  /**
   * Start the play-off phase from the league standings.
   * Picks the top N teams (4 or 8) and creates the first round of knockout matches (1 vs N, 2 vs N-1, …).
   */
  const startPlayoffFromLeague = async (tournamentId: string) => {
    try {
      // Verify all league matches completed
      const { data: leagueMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .is('group_name', null);

      const leagueRows = (leagueMatches || []).filter(m => !(m as any).round || (m as any).round); // all
      const incomplete = leagueRows.filter(m => m.status !== 'completed');
      if (incomplete.length > 0) {
        toast({ title: t('toasts.warning'), description: t('toasts.incompleteLeagueMatches', { count: incomplete.length, defaultValue: 'تبقى {{count}} مباراة غير مكتملة' }), variant: 'destructive' });
        return null;
      }

      // Tournament config
      const { data: tour } = await supabase
        .from('tournaments').select('*').eq('id', tournamentId).single();
      if (!tour) throw new Error('not found');
      const playoffSize = (tour as any).playoff_teams || 4;

      // Get standings sorted
      const { data: standings } = await supabase
        .from('standings').select('*').eq('tournament_id', tournamentId);
      if (!standings || standings.length < 2) throw new Error(t('toasts.startKnockoutFailed'));

      const sorted = [...standings].sort((a, b) =>
        (b.points || 0) - (a.points || 0) ||
        (b.goal_difference || 0) - (a.goal_difference || 0) ||
        (b.goals_for || 0) - (a.goals_for || 0)
      );
      const qualifiers = sorted.slice(0, Math.min(playoffSize, sorted.length));
      if (qualifiers.length < 2) throw new Error(t('toasts.startKnockoutFailed'));

      // Get next round number
      const { data: lastRound } = await supabase
        .from('matches').select('round')
        .eq('tournament_id', tournamentId).order('round', { ascending: false }).limit(1);
      const nextRound = (lastRound?.[0]?.round || 0) + 1;

      const playoffMatches: any[] = [];
      const half = qualifiers.length;
      for (let i = 0; i < half / 2; i++) {
        playoffMatches.push({
          tournament_id: tournamentId,
          home_team_id: qualifiers[i].team_id,
          away_team_id: qualifiers[half - 1 - i].team_id,
          round: nextRound,
          match_order: i + 1,
          status: 'scheduled' as const,
        });
      }

      if (playoffMatches.length > 0) {
        const { error } = await supabase.from('matches').insert(playoffMatches);
        if (error) throw error;
      }

      await supabase.from('tournaments').update({
        status: 'live' as TournamentStatus,
        playoff_started: true,
      } as any).eq('id', tournamentId);
      toast({ title: t('toasts.playoffStarted', { defaultValue: 'انطلق البلاي أوف 🔥' }), description: t('toasts.knockoutStartedDesc', { count: playoffMatches.length }) });
      return true;
    } catch (error: any) {
      console.error('Error starting playoff:', error);
      toast({ title: t('common.error'), description: error.message || t('toasts.startKnockoutFailed'), variant: 'destructive' });
      return null;
    }
  };

  const generateNextRound = async (tournamentId: string) => {
    try {
      const { data: allMatches } = await supabase
        .from('matches').select('*').eq('tournament_id', tournamentId)
        .is('group_name', null).order('round', { ascending: false });

      if (!allMatches || allMatches.length === 0) {
        throw new Error(t('toasts.noMatches'));
      }

      const currentRound = allMatches[0].round || 1;

      const currentRoundMatches = allMatches.filter(m => m.round === currentRound);
      const completedRoundMatches = currentRoundMatches.filter(m => m.status === 'completed');

      if (completedRoundMatches.length < currentRoundMatches.length) {
        throw new Error(t('toasts.incompleteRound'));
      }

      const winners = completedRoundMatches.map(m => m.winner_id).filter(Boolean) as string[];

      if (winners.length < 2) {
        toast({ title: t('toasts.tournamentEnded'), description: t('toasts.tournamentEndedDesc') });
        await supabase.from('tournaments').update({ status: 'completed' as TournamentStatus }).eq('id', tournamentId);
        return true;
      }

      const nextRound = currentRound + 1;
      const nextMatches = [];
      for (let i = 0; i < winners.length; i += 2) {
        if (winners[i + 1]) {
          nextMatches.push({
            tournament_id: tournamentId,
            home_team_id: winners[i],
            away_team_id: winners[i + 1],
            round: nextRound,
            match_order: Math.floor(i / 2) + 1,
            status: 'scheduled' as const,
          });
        }
      }

      if (nextMatches.length > 0) {
        const { error } = await supabase.from('matches').insert(nextMatches);
        if (error) throw error;
      }

      toast({ title: t('toasts.nextRoundManual'), description: t('toasts.nextRoundCreatedDesc', { count: nextMatches.length }) });
      return true;
    } catch (error: any) {
      console.error('Error generating next round:', error);
      toast({ title: t('common.error'), description: error.message || t('toasts.nextRoundFailed'), variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    fetchTournaments,
    createTournament,
    createLeagueTournamentWithTeams,
    deleteTournament,
    addTeams,
    performAIDraw,
    generateKnockoutMatches,
    generateGroupMatches,
    generateLeagueMatches,
    startKnockoutFromGroups,
    startPlayoffFromLeague,
    updateStandings,
    updateMatchResult,
    generateNextRound,
  };
}
