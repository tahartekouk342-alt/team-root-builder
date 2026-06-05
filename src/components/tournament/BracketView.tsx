import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';

interface BracketViewProps {
  matches: MatchWithTeams[];
  getRoundName: (round: number, totalRounds: number) => string;
  onMatchClick?: (match: MatchWithTeams) => void;
}

export function BracketView({ matches, getRoundName, onMatchClick }: BracketViewProps) {
  const { rounds, totalRounds } = useMemo(() => {
    const roundsMap = new Map<number, MatchWithTeams[]>();
    matches.forEach((match) => {
      const round = match.round;
      if (!roundsMap.has(round)) roundsMap.set(round, []);
      roundsMap.get(round)?.push(match);
    });
    const sortedRounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);
    return { rounds: sortedRounds, totalRounds: sortedRounds.length };
  }, [matches]);

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        لا توجد مباريات بعد
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max p-4 items-start">
        {rounds.map(([roundNum, roundMatches], roundIndex) => {
          // Dynamic spacing: each subsequent round gets more vertical spacing
          const verticalGap = Math.pow(2, roundIndex) * 16;
          const topPad = roundIndex > 0 ? (Math.pow(2, roundIndex) - 1) * 40 : 0;

          return (
            <div key={roundNum} className="flex flex-col" style={{ minWidth: 240 }}>
              {/* Round Header */}
              <div className="text-center mb-4 sticky top-0 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <h3 className="font-bold text-sm text-primary">
                    {getRoundName(roundNum, totalRounds)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {roundMatches.length} مباراة
                  </span>
                </div>
              </div>

              {/* Matches with dynamic spacing */}
              <div className="flex flex-col" style={{ gap: verticalGap, paddingTop: topPad }}>
                {roundMatches.map((match, matchIndex) => (
                  <div key={match.id} className="relative">
                    <BracketMatch match={match} onClick={() => onMatchClick?.(match)} />
                    {/* Connector lines */}
                    {roundIndex < rounds.length - 1 && (
                      <div className="absolute left-0 top-1/2 -translate-x-full w-4">
                        <div className="border-t-2 border-dashed border-border w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BracketMatchProps {
  match: MatchWithTeams;
  onClick?: () => void;
}

function BracketMatch({ match, onClick }: BracketMatchProps) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  return (
    <div
      className={cn(
        'w-56 rounded-xl border overflow-hidden cursor-pointer transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg hover:border-primary/50',
        isLive && 'border-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.3)]',
        isCompleted && 'border-primary/40',
        !isLive && !isCompleted && 'border-border bg-card'
      )}
      onClick={onClick}
    >
      {isLive && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          مباشر
        </div>
      )}

      {/* Home Team */}
      <div className={cn(
        'flex items-center justify-between p-3 border-b border-border/30',
        isCompleted && match.winner_id === match.home_team_id && 'bg-primary/10'
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
            {match.home_team?.logo_url ? (
              <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-full h-full object-cover" />
            ) : (
              <span>{match.home_team?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <span className={cn('font-semibold text-sm truncate',
            isCompleted && match.winner_id === match.home_team_id && 'text-primary'
          )}>
            {match.home_team?.name || 'TBD'}
          </span>
        </div>
        <span className={cn(
          'font-display font-bold text-lg min-w-[1.5rem] text-center tabular-nums',
          isCompleted && match.winner_id === match.home_team_id && 'text-primary',
          isLive && 'text-destructive'
        )}>
          {isCompleted || isLive ? match.home_score : '-'}
        </span>
      </div>

      {/* Away Team */}
      <div className={cn(
        'flex items-center justify-between p-3',
        isCompleted && match.winner_id === match.away_team_id && 'bg-primary/10'
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
            {match.away_team?.logo_url ? (
              <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-full h-full object-cover" />
            ) : (
              <span>{match.away_team?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <span className={cn('font-semibold text-sm truncate',
            isCompleted && match.winner_id === match.away_team_id && 'text-primary'
          )}>
            {match.away_team?.name || 'TBD'}
          </span>
        </div>
        <span className={cn(
          'font-display font-bold text-lg min-w-[1.5rem] text-center tabular-nums',
          isCompleted && match.winner_id === match.away_team_id && 'text-primary',
          isLive && 'text-destructive'
        )}>
          {isCompleted || isLive ? match.away_score : '-'}
        </span>
      </div>
    </div>
  );
}
