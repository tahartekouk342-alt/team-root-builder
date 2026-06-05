import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Star, Plus, Trash2 } from 'lucide-react';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';
import {
  VolleyballSet, countSetsWon, isVolleyballMatchComplete, maxSets, setsToWin,
} from '@/lib/volleyball';

interface UpdateMatchDialogProps {
  match: MatchWithTeams | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    manOfMatch?: string,
    sets?: VolleyballSet[],
  ) => Promise<boolean>;
  tournamentType?: string;
  sportType?: string;
  volleyballFormat?: string | null;
}

export function UpdateMatchDialog({
  match, open, onOpenChange, onUpdate, tournamentType, sportType, volleyballFormat,
}: UpdateMatchDialogProps) {
  const isVolleyball = sportType === 'volleyball';

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [sets, setSets] = useState<VolleyballSet[]>([{ home: 0, away: 0 }]);
  const [manOfMatch, setManOfMatch] = useState('');
  const [loading, setLoading] = useState(false);

  const isKnockout = !match?.group_name && tournamentType !== 'league';
  const maxAllowed = maxSets(volleyballFormat);
  const needed = setsToWin(volleyballFormat);

  useEffect(() => {
    if (!match) return;
    if (isVolleyball) {
      const existing = (match as any).sets_json as VolleyballSet[] | undefined;
      setSets(existing && existing.length > 0 ? existing : [{ home: 0, away: 0 }]);
    } else {
      setHomeScore(match.home_score || 0);
      setAwayScore(match.away_score || 0);
    }
    setManOfMatch('');
  }, [match, isVolleyball]);

  const tally = useMemo(() => countSetsWon(sets), [sets]);
  const complete = useMemo(
    () => (isVolleyball ? isVolleyballMatchComplete(sets, volleyballFormat) : true),
    [isVolleyball, sets, volleyballFormat],
  );

  const updateSet = (idx: number, side: 'home' | 'away', val: number) => {
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [side]: Math.max(0, val) } : s)));
  };

  const addSet = () => {
    if (sets.length >= maxAllowed) return;
    setSets((prev) => [...prev, { home: 0, away: 0 }]);
  };

  const removeSet = (idx: number) => {
    if (sets.length <= 1) return;
    setSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!match) return;
    setLoading(true);
    try {
      let success = false;
      if (isVolleyball) {
        // Use sets won as the "score"
        success = await onUpdate(match.id, tally.home, tally.away, manOfMatch || undefined, sets);
      } else {
        success = await onUpdate(match.id, homeScore, awayScore, manOfMatch || undefined);
      }
      if (success) onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  const drawNotAllowed = !isVolleyball && isKnockout && homeScore === awayScore;
  const volleyballDraw = isVolleyball && tally.home === tally.away && complete;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تحديث نتيجة المباراة</DialogTitle>
          <DialogDescription>
            {isVolleyball
              ? `أدخل نتائج الأشواط (الفائز أول من يحقق ${needed} أشواط)`
              : 'أدخل النتيجة النهائية للمباراة'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Team headers */}
          <div className="grid grid-cols-3 items-center gap-2 text-center">
            <div className="font-bold text-sm line-clamp-1">{match.home_team?.name || 'فريق 1'}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase">VS</div>
            <div className="font-bold text-sm line-clamp-1">{match.away_team?.name || 'فريق 2'}</div>
          </div>

          {isVolleyball ? (
            <>
              {/* Sets summary */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">الأشواط</div>
                <div className="flex items-center justify-center gap-3 text-3xl font-black tabular-nums">
                  <span className={tally.home > tally.away ? 'text-primary' : ''}>{tally.home}</span>
                  <span className="text-muted-foreground text-xl">-</span>
                  <span className={tally.away > tally.home ? 'text-primary' : ''}>{tally.away}</span>
                </div>
              </div>

              {/* Per-set inputs */}
              <div className="space-y-2">
                {sets.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-[28px_1fr_24px_1fr_32px] items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{idx + 1}.</span>
                    <Input
                      type="number" min={0} value={s.home}
                      onChange={(e) => updateSet(idx, 'home', parseInt(e.target.value) || 0)}
                      className="text-center font-bold tabular-nums h-10"
                    />
                    <span className="text-center text-muted-foreground text-sm">-</span>
                    <Input
                      type="number" min={0} value={s.away}
                      onChange={(e) => updateSet(idx, 'away', parseInt(e.target.value) || 0)}
                      className="text-center font-bold tabular-nums h-10"
                    />
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeSet(idx)}
                      disabled={sets.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                {sets.length < maxAllowed && !complete && (
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={addSet}>
                    <Plus className="w-3.5 h-3.5 ms-1" /> إضافة شوط
                  </Button>
                )}
              </div>

              {volleyballDraw && (
                <div className="text-center p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  لا يمكن أن تنتهي مباراة الكرة الطائرة بالتعادل
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <Label htmlFor="homeScore" className="sr-only">نتيجة الفريق الأول</Label>
                  <Input id="homeScore" type="number" min={0} value={homeScore}
                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                    className="text-center text-2xl font-black h-16" />
                </div>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <div className="flex-1 text-center">
                  <Label htmlFor="awayScore" className="sr-only">نتيجة الفريق الثاني</Label>
                  <Input id="awayScore" type="number" min={0} value={awayScore}
                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                    className="text-center text-2xl font-black h-16" />
                </div>
              </div>

              {homeScore !== awayScore && (
                <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm text-muted-foreground">الفائز: </span>
                  <span className="font-bold text-primary">
                    {homeScore > awayScore ? match.home_team?.name : match.away_team?.name}
                  </span>
                </div>
              )}

              {drawNotAllowed && (
                <div className="text-center p-3 rounded-lg bg-muted">
                  <span className="text-sm text-muted-foreground">نتيجة التعادل غير مسموحة في نظام خروج المغلوب</span>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">إلغاء</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || drawNotAllowed || volleyballDraw || (isVolleyball && !complete)}
              className="flex-1"
            >
              {loading ? <><Loader2 className="w-4 h-4 ms-2 animate-spin" />جاري الحفظ...</> : 'حفظ النتيجة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
