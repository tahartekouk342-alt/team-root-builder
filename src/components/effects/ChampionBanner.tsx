import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChampionBannerProps {
  teamName: string;
  teamLogo?: string | null;
  motm?: string | null;
  tournamentName?: string;
  completedAt?: string | Date | null;
  sportType?: 'football' | 'basketball' | 'volleyball';
  variant?: 'full' | 'compact';
}

/**
 * Editorial-style sports magazine champion banner.
 * Clean typography, monochrome with a single gold accent — no toy colors.
 */
export function ChampionBanner({
  teamName,
  teamLogo,
  motm,
  tournamentName,
  completedAt,
  sportType = 'football',
  variant = 'full',
}: ChampionBannerProps) {
  const { t, i18n } = useTranslation();
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'ar-DZ', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';
  const sportLabel = sportType === 'basketball' ? '🏀' : sportType === 'volleyball' ? '🏐' : '⚽';

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold shadow-sm">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span>{t('tournament.champion')}:</span>
        <span className="font-bold">{teamName}</span>
      </div>
    );
  }

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
      aria-label={`${t('tournament.champion')}: ${teamName}`}
    >
      {/* Top hairline gold bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-0">
        {/* Left: Editorial photo block (logo as hero) */}
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[280px] bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85 flex items-center justify-center overflow-hidden">
          {/* Subtle pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {teamLogo ? (
            <img
              src={teamLogo}
              alt={teamName}
              className="relative w-44 h-44 md:w-52 md:h-52 object-cover rounded-full ring-4 ring-amber-400/80 shadow-2xl"
            />
          ) : (
            <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-background/10 ring-4 ring-amber-400/80 flex items-center justify-center">
              <Trophy className="w-20 h-20 text-amber-400" />
            </div>
          )}

          {/* Sport tag */}
          <span className="absolute top-4 start-4 text-xl drop-shadow-md">{sportLabel}</span>
          {/* Date */}
          {dateStr && (
            <span className="absolute bottom-4 start-4 text-[10px] uppercase tracking-[0.2em] text-background/70 font-mono">
              {dateStr}
            </span>
          )}
        </div>

        {/* Right: Editorial content */}
        <div className="relative p-6 md:p-8 flex flex-col justify-center bg-card">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-amber-500" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-600 dark:text-amber-400">
              {t('tournament.champion')}
            </span>
          </div>

          {/* Tournament name */}
          {tournamentName && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 line-clamp-1">
              {tournamentName}
            </p>
          )}

          {/* Headline (team name) */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight text-foreground mb-4">
            {teamName}
          </h2>

          {/* Divider */}
          <div className="h-px w-12 bg-foreground/20 mb-4" />

          {/* MOTM (small editorial line) */}
          {motm && (
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-semibold text-foreground/80">{t('tournament.manOfMatchFinal')}:</span>{' '}
              <span className="font-medium">{motm}</span>
            </p>
          )}

          {/* Footer brand line */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
            <span>BOTTOLA · OFFICIAL</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">№ 01</span>
          </div>
        </div>
      </div>

      {/* Bottom hairline */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
    </article>
  );
}
