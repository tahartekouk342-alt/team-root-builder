import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dice5, RefreshCw, Trophy, Users } from 'lucide-react';
import { shuffle, distributeIntoGroups, knockoutFirstRound, roundRobin, type DrawTeam } from '@/lib/draw';

interface Props {
  teams: DrawTeam[];
  type: 'knockout' | 'league' | 'groups';
  numGroups?: number;
  onConfirm: (result: { ordered: DrawTeam[]; groups?: Record<string, DrawTeam[]> }) => void;
  confirmLabel?: string;
}

export function DrawDisplay({ teams, type, numGroups = 2, onConfirm, confirmLabel = 'تأكيد القرعة' }: Props) {
  const [ordered, setOrdered] = useState<DrawTeam[]>(() => shuffle(teams));
  const [groups, setGroups] = useState<Record<string, DrawTeam[]>>(() =>
    type === 'groups' ? distributeIntoGroups(shuffle(teams), numGroups) : {},
  );

  const redraw = () => {
    const s = shuffle(teams);
    setOrdered(s);
    if (type === 'groups') setGroups(distributeIntoGroups(s, numGroups));
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Dice5 className="w-5 h-5 text-primary" />
          نتيجة القرعة ({teams.length} فريق)
        </h3>
        <Button variant="outline" size="sm" onClick={redraw}>
          <RefreshCw className="w-4 h-4 ms-1" /> إعادة القرعة
        </Button>
      </div>

      {type === 'groups' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(groups).map(([gn, gt]) => (
            <Card key={gn} className="border-primary/30">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">المجموعة {gn}</span>
                  <span className="text-xs text-muted-foreground">{gt.length} فرق</span>
                </div>
                <ul className="space-y-1">
                  {gt.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      {t.logo_url ? <img src={t.logo_url} className="w-6 h-6 rounded-full object-cover" alt="" /> : <span className="text-xs">⚽</span>}
                      <span className="font-medium truncate">{t.name}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t text-[11px] text-muted-foreground">
                  <strong>المباريات:</strong> {roundRobin(gt).length} مباراة
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {type === 'league' && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">ترتيب الفرق في الدوري</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ordered.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  {t.logo_url ? <img src={t.logo_url} className="w-6 h-6 rounded-full object-cover" alt="" /> : <span className="text-xs">⚽</span>}
                  <span className="truncate">{t.name}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t text-[11px] text-muted-foreground">
              <strong>المباريات:</strong> {roundRobin(ordered).length} مباراة لكل دور (كل فريق ضد جميع خصومه)
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'knockout' && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">مواجهات الجولة الأولى</span>
            </div>
            <div className="space-y-2">
              {knockoutFirstRound(ordered).map(([a, b], i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-2 rounded bg-muted/50">
                  <div className="text-sm font-medium text-end truncate">{a?.name || 'BYE'}</div>
                  <span className="text-xs font-bold text-primary px-2">VS</span>
                  <div className="text-sm font-medium truncate">{b?.name || 'BYE'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button className="w-full bg-primary text-primary-foreground" onClick={() => onConfirm({ ordered, groups })}>
        {confirmLabel}
      </Button>
    </div>
  );
}
