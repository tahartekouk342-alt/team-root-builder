import { BrandLogo } from '@/components/BrandLogo';
import { useState, useMemo } from 'react';
import { Bell, CalendarDays, Trophy, Edit3, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UpdateMatchDialog } from '@/components/tournament/UpdateMatchDialog';
import { useTournaments } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SPORT_OPTIONS = [
  { v: 'all', l: 'كل الرياضات' },
  { v: 'football', l: 'كرة قدم ⚽' },
  { v: 'basketball', l: 'كرة سلة 🏀' },
  { v: 'volleyball', l: 'كرة طائرة 🏐' },
];

export default function OrganizerMatches() {
  const { user } = useAuth();
  const { updateMatchResult } = useTournaments();
  const { toast } = useToast();
  const [sport, setSport] = useState('all');
  const [tournamentId, setTournamentId] = useState('all');
  const [editMatch, setEditMatch] = useState<any>(null);
  const [cardsMatch, setCardsMatch] = useState<any>(null);

  const { data: tournaments = [] } = useQuery({
    queryKey: ['org-tournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('tournaments').select('id, name, sport_type, type, volleyball_format').eq('owner_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredTournaments = useMemo(() =>
    sport === 'all' ? tournaments : tournaments.filter((t: any) => (t.sport_type || 'football') === sport),
    [tournaments, sport]);

  const { data: matches = [], refetch } = useQuery({
    queryKey: ['org-matches', tournamentId, sport, filteredTournaments.map(t => t.id).join(',')],
    queryFn: async () => {
      const ids = tournamentId === 'all' ? filteredTournaments.map(t => t.id) : [tournamentId];
      if (!ids.length) return [];
      const tMap = Object.fromEntries(filteredTournaments.map((t: any) => [t.id, t]));
      const { data: ms } = await supabase.from('matches').select('*').in('tournament_id', ids)
        .order('match_date', { ascending: true }).limit(100);
      const teamIds = Array.from(new Set((ms || []).flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean) as string[]));
      const { data: teams } = teamIds.length ? await supabase.from('teams').select('*').in('id', teamIds) : { data: [] };
      const teamMap = Object.fromEntries((teams || []).map((t: any) => [t.id, t]));
      return (ms || []).map(m => ({
        ...m, tournament: tMap[m.tournament_id],
        home_team: teamMap[m.home_team_id!], away_team: teamMap[m.away_team_id!],
      }));
    },
    enabled: filteredTournaments.length > 0,
  });

  const STATUS: any = {
    scheduled: { l: 'مقررة', c: 'bg-amber-50 text-amber-700' },
    live: { l: 'جارية', c: 'bg-red-50 text-red-700' },
    completed: { l: 'مكتملة', c: 'bg-purple-50 text-purple-700' },
    postponed: { l: 'مؤجلة', c: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <header className="h-16 px-4 lg:px-8 flex items-center justify-between bg-card border-b sticky top-0 z-30">
        <BrandLogo size="sm" />
        <h1 className="font-display text-xl font-bold tracking-wide">جدولة المباريات</h1>
        <Bell className="w-6 h-6 text-muted-foreground" />
      </header>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">الرياضة</Label>
            <Select value={sport} onValueChange={(v) => { setSport(v); setTournamentId('all'); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SPORT_OPTIONS.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">البطولة</Label>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل البطولات</SelectItem>
                {filteredTournaments.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {matches.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>لا توجد مباريات</p>
          </div>
        )}

        {matches.map(m => {
          const st = STATUS[m.status] || STATUS.scheduled;
          return (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Trophy className="w-3 h-3" /> {m.tournament?.name}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${st.c}`}>{st.l}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted overflow-hidden flex items-center justify-center mb-1">
                      {m.home_team?.logo_url ? <img src={m.home_team.logo_url} className="w-full h-full object-cover" alt="" /> : '⚽'}
                    </div>
                    <p className="text-sm font-semibold truncate">{m.home_team?.name || '?'}</p>
                  </div>
                  <div className="text-center">
                    {m.status === 'completed'
                      ? <p className="text-2xl font-black tabular-nums">{m.home_score} - {m.away_score}</p>
                      : <p className="text-lg font-bold text-primary">{m.match_time || '—'}</p>}
                    <p className="text-[10px] text-muted-foreground">جولة {m.round}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted overflow-hidden flex items-center justify-center mb-1">
                      {m.away_team?.logo_url ? <img src={m.away_team.logo_url} className="w-full h-full object-cover" alt="" /> : '⚽'}
                    </div>
                    <p className="text-sm font-semibold truncate">{m.away_team?.name || '?'}</p>
                  </div>
                </div>

                {(m.home_yellow_cards > 0 || m.away_yellow_cards > 0 || m.home_red_cards > 0 || m.away_red_cards > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center justify-center gap-2 p-2 rounded bg-muted/40">
                      {m.home_yellow_cards > 0 && <span>🟨 {m.home_yellow_cards}</span>}
                      {m.home_red_cards > 0 && <span>🟥 {m.home_red_cards}</span>}
                    </div>
                    <div className="flex items-center justify-center gap-2 p-2 rounded bg-muted/40">
                      {m.away_yellow_cards > 0 && <span>🟨 {m.away_yellow_cards}</span>}
                      {m.away_red_cards > 0 && <span>🟥 {m.away_red_cards}</span>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditMatch(m)}>
                    <Edit3 className="w-3.5 h-3.5 ms-1" /> النتيجة
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCardsMatch(m)}>
                    🟨🟥 بطاقات وأهداف
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editMatch && (
        <UpdateMatchDialog
          match={editMatch as any} open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)}
          tournamentType={editMatch.tournament?.type} sportType={editMatch.tournament?.sport_type || 'football'}
          volleyballFormat={editMatch.tournament?.volleyball_format}
          onUpdate={async (mid, hs, as, mom, sets) => {
            const ok = await updateMatchResult(mid, hs, as, mom, sets);
            if (ok) refetch();
            return !!ok;
          }}
        />
      )}

      {cardsMatch && (
        <CardsScorersDialog match={cardsMatch} onClose={() => setCardsMatch(null)} onSaved={() => { setCardsMatch(null); refetch(); }} />
      )}
    </div>
  );
}

function CardsScorersDialog({ match, onClose, onSaved }: any) {
  const { toast } = useToast();
  const [hY, setHY] = useState(match.home_yellow_cards || 0);
  const [aY, setAY] = useState(match.away_yellow_cards || 0);
  const [hR, setHR] = useState(match.home_red_cards || 0);
  const [aR, setAR] = useState(match.away_red_cards || 0);
  const [scorers, setScorers] = useState<any[]>(match.scorers || []);
  const [name, setName] = useState('');
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [motm, setMotm] = useState<string>(match.man_of_the_match || '');
  const [saving, setSaving] = useState(false);

  const homePlayers: string[] = match.home_team?.player_names || [];
  const awayPlayers: string[] = match.away_team?.player_names || [];

  const addScorer = () => {
    if (!name.trim()) return;
    setScorers([...scorers, { name: name.trim(), team }]);
    setName('');
  };

  const save = async () => {
    setSaving(true);
    try {
      await supabase.from('matches').update({
        home_yellow_cards: hY, away_yellow_cards: aY,
        home_red_cards: hR, away_red_cards: aR,
        scorers, man_of_the_match: motm || null,
      }).eq('id', match.id);
      toast({ title: '✅ تم الحفظ' });
      onSaved();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const players = team === 'home' ? homePlayers : awayPlayers;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold">بطاقات وأهداف</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-bold text-center">{match.home_team?.name}</div>
              <div><Label className="text-xs">🟨 صفراء</Label><Input type="number" min={0} value={hY} onChange={e => setHY(+e.target.value || 0)} /></div>
              <div><Label className="text-xs">🟥 حمراء</Label><Input type="number" min={0} value={hR} onChange={e => setHR(+e.target.value || 0)} /></div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-center">{match.away_team?.name}</div>
              <div><Label className="text-xs">🟨 صفراء</Label><Input type="number" min={0} value={aY} onChange={e => setAY(+e.target.value || 0)} /></div>
              <div><Label className="text-xs">🟥 حمراء</Label><Input type="number" min={0} value={aR} onChange={e => setAR(+e.target.value || 0)} /></div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <Label className="text-sm font-bold">المسجلون ⚽</Label>
            <div className="grid grid-cols-2 gap-2">
              <select value={team} onChange={e => setTeam(e.target.value as any)} className="h-9 rounded border bg-card text-sm px-2">
                <option value="home">{match.home_team?.name}</option>
                <option value="away">{match.away_team?.name}</option>
              </select>
              {players.length > 0 ? (
                <select value={name} onChange={e => setName(e.target.value)} className="h-9 rounded border bg-card text-sm px-2">
                  <option value="">اختر لاعباً</option>
                  {players.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <Input placeholder="اسم المسجل" value={name} onChange={e => setName(e.target.value)} />
              )}
            </div>
            <Button size="sm" onClick={addScorer} className="w-full" variant="outline">إضافة هدف</Button>
            {scorers.length > 0 && (
              <ul className="space-y-1">
                {scorers.map((s, i) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded bg-muted/40 text-sm">
                    <span>⚽ {s.name} <span className="text-xs text-muted-foreground">({s.team === 'home' ? match.home_team?.name : match.away_team?.name})</span></span>
                    <button onClick={() => setScorers(scorers.filter((_, j) => j !== i))} className="text-destructive text-xs">حذف</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
            <Button onClick={save} disabled={saving} className="flex-1 bg-primary text-primary-foreground">حفظ</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
