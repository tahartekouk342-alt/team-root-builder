import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { Database } from '@/integrations/supabase/types';

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type Standing = Database['public']['Tables']['standings']['Row'];

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
  winner: Team | null;
}

export function useTournamentDetails(tournamentId: string | undefined) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchTournamentDetails = useCallback(async () => {
    if (!tournamentId) return;

    try {
      // Fetch tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .maybeSingle();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { ascending: true });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch matches — manual join because matches table has no FKs
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('match_order', { ascending: true });

      if (matchesError) throw matchesError;
      const teamMap = Object.fromEntries((teamsData || []).map((t: any) => [t.id, t]));
      const withTeams = (matchesData || []).map((m: any) => ({
        ...m,
        home_team: teamMap[m.home_team_id] || null,
        away_team: teamMap[m.away_team_id] || null,
        winner: teamMap[m.winner_id] || null,
      }));
      setMatches(withTeams as MatchWithTeams[]);

      // Fetch standings
      const { data: standingsData, error: standingsError } = await supabase
        .from('standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('points', { ascending: false });

      if (standingsError) throw standingsError;
      setStandings(standingsData || []);
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      toast({
        title: t('common.error'),
        description: t('toasts.fetchDetailsFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tournamentId, toast, t]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tournamentId) return;

    fetchTournamentDetails();

    const matchesChannel = supabase
      .channel(`matches-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchTournamentDetails();
        }
      )
      .subscribe();

    const standingsChannel = supabase
      .channel(`standings-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'standings',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchTournamentDetails();
        }
      )
      .subscribe();

    return () => {
      matchesChannel.unsubscribe();
      standingsChannel.unsubscribe();
    };
  }, [tournamentId, fetchTournamentDetails]);

  const getMatchesByRound = () => {
    const roundsMap = new Map<number, MatchWithTeams[]>();
    
    matches.forEach((match) => {
      const round = match.round;
      if (!roundsMap.has(round)) {
        roundsMap.set(round, []);
      }
      roundsMap.get(round)?.push(match);
    });

    return Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - round;
    switch (roundsFromEnd) {
      case 0:
        return t('tournament.rounds.final');
      case 1:
        return t('tournament.rounds.semifinal');
      case 2:
        return t('tournament.rounds.quarterfinal');
      case 3:
        return t('tournament.rounds.round16');
      case 4:
        return t('tournament.rounds.round32');
      default:
        return `${t('tournament.round')} ${round}`;
    }
  };

  return {
    tournament,
    teams,
    matches,
    standings,
    loading,
    fetchTournamentDetails,
    getMatchesByRound,
    getRoundName,
  };
}
