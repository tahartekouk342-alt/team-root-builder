import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trophy, MapPin } from 'lucide-react';

interface Team {
  name: string;
  logo?: string;
  score?: number;
}

interface MatchCardProps {
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'completed';
  matchday?: string;
  venueName?: string;
  stadiumImageUrl?: string;
  onClick?: () => void;
}

export function MatchCard({
  homeTeam,
  awayTeam,
  date,
  time,
  status,
  matchday,
  venueName,
  stadiumImageUrl,
  onClick,
}: MatchCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-[1.75rem] border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer",
        status === 'live' && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Stadium Mini Image Header */}
      <div className="relative h-24 overflow-hidden">
        {stadiumImageUrl ? (
          <img 
            src={stadiumImageUrl} 
            alt={venueName || 'الملعب'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        
        {venueName && (
          <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] font-bold text-foreground/70 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />
            {venueName}
          </div>
        )}
      </div>

      <div className="p-5 pt-2">
        {/* Match Info Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              {matchday || 'مباراة'}
            </span>
          </div>

          {status === 'live' && (
            <div className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              مباشر
            </div>
          )}
          {status === 'upcoming' && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold">
              <Calendar className="w-3 h-3" />
              {date}
            </div>
          )}
          {status === 'completed' && (
            <Badge variant="outline" className="text-[10px] font-bold border-muted text-muted-foreground">
              انتهت
            </Badge>
          )}
        </div>

        {/* Teams Display */}
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform">
              {homeTeam.logo ? (
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-lg font-bold text-primary">{homeTeam.name.charAt(0)}</span>
              )}
            </div>
            <span className="font-bold text-xs text-foreground line-clamp-1">{homeTeam.name}</span>
          </div>

          {/* Score / VS Area */}
          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {(status === 'live' || status === 'completed') && homeTeam.score !== undefined && awayTeam.score !== undefined ? (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-2xl font-black tabular-nums",
                  status === 'live' && "text-primary"
                )}>
                  {homeTeam.score}
                </span>
                <span className="text-muted-foreground font-bold">-</span>
                <span className={cn(
                  "text-2xl font-black tabular-nums",
                  status === 'live' && "text-primary"
                )}>
                  {awayTeam.score}
                </span>
              </div>
            ) : (
              <div className="bg-muted/50 px-3 py-1 rounded-full">
                <span className="text-[10px] font-black text-muted-foreground">{time}</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform">
              {awayTeam.logo ? (
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-lg font-bold text-primary">{awayTeam.name.charAt(0)}</span>
              )}
            </div>
            <span className="font-bold text-xs text-foreground line-clamp-1">{awayTeam.name}</span>
          </div>
        </div>

        {/* Date/Time for upcoming */}
        {status === 'upcoming' && (
          <div className="mt-4 pt-3 border-t border-dashed flex justify-center">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-bold">{time}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
