import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TeamStanding {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

interface StandingsTableProps {
  standings: TeamStanding[];
  highlightPositions?: {
    promotion?: number[];
    relegation?: number[];
  };
  sportType?: string;
}

export function StandingsTable({ standings, highlightPositions, sportType = 'football' }: StandingsTableProps) {
  const { t } = useTranslation();
  const isVolleyball = sportType === 'volleyball';
  const diffLabel = isVolleyball ? t('standings.setsDiff', 'فارق الأشواط') : t('standings.goalDiff');
  const getPositionStyle = (position: number) => {
    if (highlightPositions?.promotion?.includes(position)) {
      return 'border-r-4 border-r-primary bg-primary/5';
    }
    if (highlightPositions?.relegation?.includes(position)) {
      return 'border-r-4 border-r-destructive bg-destructive/5';
    }
    return '';
  };

  const getFormBadge = (result: 'W' | 'D' | 'L') => {
    const styles = {
      W: 'bg-success/10 text-success border-success/20',
      D: 'bg-muted text-muted-foreground border-muted',
      L: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    const labels = { W: t('standings.wonShort'), D: t('standings.drawnShort'), L: t('standings.lostShort') };
    
    return (
      <span className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border",
        styles[result]
      )}>
        {labels[result]}
      </span>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
          <TableHead className="w-14 text-center font-bold">#</TableHead>
          <TableHead className="font-bold">{t('standings.team')}</TableHead>
          <TableHead className="text-center w-12 font-bold">{t('standings.played')}</TableHead>
          <TableHead className="text-center w-12 hidden sm:table-cell font-bold">{t('standings.won')}</TableHead>
          {!isVolleyball && (
            <TableHead className="text-center w-12 hidden sm:table-cell font-bold">{t('standings.drawn')}</TableHead>
          )}
          <TableHead className="text-center w-12 hidden sm:table-cell font-bold">{t('standings.lost')}</TableHead>
          <TableHead className="text-center w-16 hidden md:table-cell font-bold">{diffLabel}</TableHead>
          <TableHead className="text-center w-14 font-bold text-primary">{t('standings.points')}</TableHead>
          <TableHead className="text-center hidden lg:table-cell font-bold">{t('standings.form')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((team, index) => (
          <TableRow
            key={team.name}
            className={cn(
              "transition-colors hover:bg-muted/30",
              getPositionStyle(team.position),
              index % 2 === 1 && "bg-muted/10"
            )}
          >
            <TableCell className="text-center">
              <span className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm",
                team.position <= 2 && "bg-primary/10 text-primary",
                team.position >= 7 && "bg-destructive/10 text-destructive",
                team.position > 2 && team.position < 7 && "bg-muted text-muted-foreground"
              )}>
                {team.position}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-bold shadow-sm">
                  {team.name.charAt(0)}
                </div>
                <span className="font-semibold text-foreground">{team.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-center text-muted-foreground font-medium">{team.played}</TableCell>
            <TableCell className="text-center text-muted-foreground font-medium hidden sm:table-cell">{team.won}</TableCell>
            {!isVolleyball && (
              <TableCell className="text-center text-muted-foreground font-medium hidden sm:table-cell">{team.drawn}</TableCell>
            )}
            <TableCell className="text-center text-muted-foreground font-medium hidden sm:table-cell">{team.lost}</TableCell>
            <TableCell className={cn(
              "text-center font-semibold hidden md:table-cell",
              team.goalDifference > 0 && "text-success",
              team.goalDifference < 0 && "text-destructive",
              team.goalDifference === 0 && "text-muted-foreground"
            )}>
              {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
            </TableCell>
            <TableCell className="text-center">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 font-display text-xl font-bold text-primary">
                {team.points}
              </span>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="flex items-center justify-center gap-1.5">
                {team.form?.map((result, i) => (
                  <span key={i}>{getFormBadge(result)}</span>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
