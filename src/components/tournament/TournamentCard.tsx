import { Trophy, Users, Calendar, ChevronLeft, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
  id: string;
  name: string;
  teams: number;
  startDate: string;
  status: 'upcoming' | 'live' | 'completed' | 'draft' | 'active';
  type: 'knockout' | 'league' | 'groups';
  sportType?: 'football' | 'basketball' | 'volleyball';
  ageCategory?: string | null;
  championName?: string | null;
  logoUrl?: string | null;
  venueName?: string | null;
  stadiumImageUrl?: string | null;
  refereeName?: string | null;
  onClick?: () => void;
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-muted-foreground',
  active: 'bg-success animate-pulse',
  upcoming: 'bg-info',
  live: 'bg-destructive animate-pulse',
  completed: 'bg-success',
};

export function TournamentCard({
  name, teams, startDate, status, sportType = 'football',
  ageCategory, championName, logoUrl, venueName, stadiumImageUrl, onClick,
}: TournamentCardProps) {
  const { t } = useTranslation();

  const statusLabel: Record<string, string> = {
    draft: t('tournament.draft'),
    active: t('tournament.ongoing'),
    upcoming: t('tournament.upcoming'),
    live: t('tournament.ongoing'),
    completed: t('tournament.completed'),
  };

  const sportEmoji = sportType === 'basketball' ? '🏀' : sportType === 'volleyball' ? '🏐' : '⚽';

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-2xl border-border/70',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/40',
      )}
    >
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85">
        {stadiumImageUrl && (
          <img src={stadiumImageUrl} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
          />
        )}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

        <div className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md border border-border/50 text-[10px] font-semibold uppercase tracking-wider">
          <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[status])} />
          <span>{statusLabel[status]}</span>
        </div>

        <span className="absolute top-3 end-3 text-lg drop-shadow-md">{sportEmoji}</span>

        <div className="absolute -bottom-6 end-4 z-20">
          <div className="w-14 h-14 rounded-2xl bg-card border-2 border-background shadow-lg flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-7 h-7 text-primary" />
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-7">
        {status === 'completed' && championName && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-2 rounded-md bg-foreground text-background text-[10px] font-semibold">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-[160px]">{championName}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <ChevronLeft className="w-4 h-4 text-muted-foreground rtl:rotate-180 shrink-0 mt-1 group-hover:text-primary transition-colors" />
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {teams}</span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {startDate}</span>
          {ageCategory && (
            <>
              <span className="text-border">·</span>
              <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground/80 font-semibold uppercase text-[10px] tracking-wider">
                {ageCategory}
              </span>
            </>
          )}
        </div>

        {venueName && (
          <p className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {venueName}
          </p>
        )}
      </div>
    </Card>
  );
}
