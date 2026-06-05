import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';

interface MatchesListProps {
  matches: MatchWithTeams[];
  onMatchClick?: (match: MatchWithTeams) => void;
  getRoundName?: (round: number, totalRounds: number) => string;
  showDate?: boolean;
  compact?: boolean;
  venueName?: string;
  stadiumImageUrl?: string;
}

export function MatchesList({ matches, onMatchClick, getRoundName, showDate = true, compact = false, venueName, stadiumImageUrl }: MatchesListProps) {
  const { t, i18n } = useTranslation();
  if (matches.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{t('tournament.noMatches')}</div>;
  }

  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  const totalRounds = Math.max(...matches.map((m) => m.round));

  return (
    <div className="space-y-6">
      {Object.entries(matchesByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, roundMatches]) => (
          <div key={round}>
            <h3 className="font-bold text-lg mb-3 text-primary">
              {getRoundName ? getRoundName(Number(round), totalRounds) : `${t('tournament.round')} ${round}`}
            </h3>
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', compact && 'gap-2')}>
              {roundMatches.map((match) => (
                <MatchCardInline
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                  showDate={showDate}
                  venueName={venueName}
                  stadiumImageUrl={stadiumImageUrl}
                  lang={i18n.language}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

interface MatchCardInlineProps {
  match: MatchWithTeams;
  onClick?: () => void;
  showDate?: boolean;
  venueName?: string;
  stadiumImageUrl?: string;
  lang?: string;
}

function MatchCardInline({ match, onClick, showDate, venueName, stadiumImageUrl, lang = 'ar' }: MatchCardInlineProps) {
  const { t } = useTranslation();
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const imgSrc = stadiumImageUrl || '/images/sport-stadium.jpg';
  const localeStr = lang === 'fr' ? 'fr-FR' : 'ar-SA';

  return (
    <div
      className={cn(
        'rounded-[1.75rem] border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-lg group',
        isLive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      onClick={onClick}
    >
      {/* Stadium Mini Image Header */}
      <div className="relative h-20 overflow-hidden">
        <img src={imgSrc} alt={venueName || 'الملعب'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        {(venueName || match.match_date) && (
          <div className="absolute bottom-2 right-3 flex items-center gap-2">
            {venueName && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {venueName}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 pt-2">
        {/* Status Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {match.group_name ? `${t('tournament.groupLabel')} ${match.group_name}` : t('tournament.match')}
          </span>
          {isLive && (
            <div className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground" />{t('tournament.live').replace('🔴 ', '')}
            </div>
          )}
          {isCompleted && <Badge variant="outline" className="text-[10px] font-bold border-muted text-muted-foreground">{t('tournament.finished')}</Badge>}
          {!isLive && !isCompleted && showDate && match.match_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(match.match_date).toLocaleDateString(localeStr)}
            </span>
          )}
        </div>

        {/* Teams Display */}
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-1.5">
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform overflow-hidden">
              {match.home_team?.logo_url ? (
                <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-primary">{match.home_team?.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <span className="font-bold text-xs line-clamp-1">{match.home_team?.name || 'TBD'}</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center justify-center min-w-[56px]">
            {(isLive || isCompleted) ? (
              <div className="flex items-center gap-1.5">
                <span className={cn('text-xl font-black tabular-nums', isLive && 'text-primary')}>{match.home_score ?? 0}</span>
                <span className="text-muted-foreground font-bold text-sm">-</span>
                <span className={cn('text-xl font-black tabular-nums', isLive && 'text-primary')}>{match.away_score ?? 0}</span>
              </div>
            ) : (
              <div className="bg-muted/50 px-3 py-1 rounded-full">
                <span className="text-[10px] font-black text-muted-foreground">{match.match_time || t('common.vs')}</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-1.5">
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform overflow-hidden">
              {match.away_team?.logo_url ? (
                <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-primary">{match.away_team?.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <span className="font-bold text-xs line-clamp-1">{match.away_team?.name || 'TBD'}</span>
          </div>
        </div>

        {/* Time for upcoming */}
        {!isLive && !isCompleted && match.match_time && (
          <div className="mt-3 pt-2 border-t border-dashed border-border flex justify-center">
            <span className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold">
              <Clock className="w-3 h-3" />{match.match_time}
            </span>
          </div>
        )}

        {/* Volleyball sets detail */}
        {isCompleted && Array.isArray((match as any).sets_detail) && (match as any).sets_detail.length > 0 && (
          <div className="mt-3 pt-2 border-t border-dashed border-border flex justify-center flex-wrap gap-1.5">
            {((match as any).sets_detail as Array<{ home: number; away: number }>).map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold tabular-nums"
                title={`الشوط ${i + 1}`}
              >
                {s.home}-{s.away}
              </span>
            ))}
          </div>
        )}

        {/* Man of the Match */}
        {isCompleted && (match as any).man_of_match_name && (
          <div className="mt-3 pt-2 border-t border-dashed border-border flex justify-center">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {t('tournament.manOfMatch')}: {(match as any).man_of_match_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
