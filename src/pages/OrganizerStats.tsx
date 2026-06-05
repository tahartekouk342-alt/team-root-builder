import { BrandLogo } from '@/components/BrandLogo';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, BarChart3, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const SPORTS = [
  { v: 'all', l: 'كل الرياضات' },
  { v: 'football', l: 'كرة قدم ⚽' },
  { v: 'basketball', l: 'كرة سلة 🏀' },
  { v: 'volleyball', l: 'كرة طائرة 🏐' },
];

export default function OrganizerStats() {
  const { user } = useAuth();
  const [sport, setSport] = useState('all');
  const [tournamentId, setTournamentId] = useState('all');

  const { data: tournaments = [] } = useQuery({
    queryKey: ['stats-tournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('tournaments').select('id, name, sport_type, type').eq('owner_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredTours = useMemo(() =>
    sport === 'all' ? tournaments : tournaments.filter((t: any) => (t.sport_type || 'football') === sport),
    [tournaments, sport]);

  const { data: stats } = useQuery({
    queryKey: ['stats-data', tournamentId, sport, filteredTours.map((t: any) => t.id).join(',')],
    queryFn: async () => {
      const ids = tournamentId === 'all' ? filteredTours.map((t: any) => t.id) : [tournamentId];
      if (!ids.length) return { teams: [], matches: [], scorers: [] };
      const [{ data: teams }, { data: matches }] = await Promise.all([
        supabase.from('teams').select('*').in('tournament_id', ids),
        supabase.from('matches').select('*').in('tournament_id', ids),
      ]);
      const teamMap = Object.fromEntries((teams || []).map((t: any) => [t.id, t]));

      // build per-team aggregates
      const agg: Record<string, any> = {};
      for (const t of teams || []) {
        agg[t.id] = {
          team: t, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, YC: 0, RC: 0, Pts: 0,
        };
      }
      const scorers: Record<string, { name: string; team: string; goals: number }> = {};
      for (const m of matches || []) {
        if (m.status !== 'completed') continue;
        const h = agg[m.home_team_id!]; const a = agg[m.away_team_id!];
        if (h) {
          h.P++; h.GF += m.home_score || 0; h.GA += m.away_score || 0;
          h.YC += m.home_yellow_cards || 0; h.RC += m.home_red_cards || 0;
          if ((m.home_score || 0) > (m.away_score || 0)) { h.W++; h.Pts += 3; }
          else if ((m.home_score || 0) === (m.away_score || 0)) { h.D++; h.Pts += 1; }
          else h.L++;
        }
        if (a) {
          a.P++; a.GF += m.away_score || 0; a.GA += m.home_score || 0;
          a.YC += m.away_yellow_cards || 0; a.RC += m.away_red_cards || 0;
          if ((m.away_score || 0) > (m.home_score || 0)) { a.W++; a.Pts += 3; }
          else if ((m.home_score || 0) === (m.away_score || 0)) { a.D++; a.Pts += 1; }
          else a.L++;
        }
        const ms = (m.scorers as any[]) || [];
        for (const s of ms) {
          const teamObj = s.team === 'home' ? teamMap[m.home_team_id!] : teamMap[m.away_team_id!];
          const key = `${s.name}__${teamObj?.id || ''}`;
          if (!scorers[key]) scorers[key] = { name: s.name, team: teamObj?.name || '—', goals: 0 };
          scorers[key].goals += 1;
        }
      }
      const teamRows = Object.values(agg)
        .sort((a: any, b: any) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF);
      const scorerRows = Object.values(scorers).sort((a, b) => b.goals - a.goals);
      return { teams: teamRows, scorers: scorerRows };
    },
    enabled: filteredTours.length > 0,
  });

  const downloadCSV = () => {
    if (!stats) return;
    const header = 'الفريق,لعب,فاز,تعادل,خسر,أهداف لـ,أهداف عليه,بطاقات صفراء,بطاقات حمراء,نقاط\n';
    const body = stats.teams.map((r: any) =>
      [r.team.name, r.P, r.W, r.D, r.L, r.GF, r.GA, r.YC, r.RC, r.Pts].join(',')).join('\n');
    const scorers = '\n\nالهدافون\nاللاعب,الفريق,الأهداف\n' +
      stats.scorers.map(s => `${s.name},${s.team},${s.goals}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + body + scorers], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bottolat-stats-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8" dir="rtl">
      <header className="h-16 px-4 lg:px-8 flex items-center justify-between bg-card border-b sticky top-0 z-30 print:hidden">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold">الإحصائيات</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 ms-1" /> طباعة</Button>
          <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="w-4 h-4 ms-1" /> CSV</Button>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <div>
            <Label className="text-xs">الرياضة</Label>
            <Select value={sport} onValueChange={(v) => { setSport(v); setTournamentId('all'); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SPORTS.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">البطولة</Label>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل البطولات</SelectItem>
                {filteredTours.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> إحصائيات الفرق</h2>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>الفريق</TableHead>
                    <TableHead className="text-center">ل</TableHead>
                    <TableHead className="text-center">ف</TableHead>
                    <TableHead className="text-center">ت</TableHead>
                    <TableHead className="text-center">خ</TableHead>
                    <TableHead className="text-center">له</TableHead>
                    <TableHead className="text-center">عليه</TableHead>
                    <TableHead className="text-center">🟨</TableHead>
                    <TableHead className="text-center">🟥</TableHead>
                    <TableHead className="text-center font-bold text-primary">نقاط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.teams || []).map((r: any, i: number) => (
                    <TableRow key={r.team.id}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell className="font-semibold">{r.team.name}</TableCell>
                      <TableCell className="text-center">{r.P}</TableCell>
                      <TableCell className="text-center">{r.W}</TableCell>
                      <TableCell className="text-center">{r.D}</TableCell>
                      <TableCell className="text-center">{r.L}</TableCell>
                      <TableCell className="text-center">{r.GF}</TableCell>
                      <TableCell className="text-center">{r.GA}</TableCell>
                      <TableCell className="text-center">{r.YC}</TableCell>
                      <TableCell className="text-center">{r.RC}</TableCell>
                      <TableCell className="text-center font-bold text-primary">{r.Pts}</TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.teams || stats.teams.length === 0) && (
                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-display text-lg font-bold">الهدافون ⚽</h2>
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>اللاعب</TableHead><TableHead>الفريق</TableHead>
                <TableHead className="text-center">الأهداف</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(stats?.scorers || []).map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell>{s.team}</TableCell>
                    <TableCell className="text-center font-bold text-primary">{s.goals}</TableCell>
                  </TableRow>
                ))}
                {(!stats?.scorers || stats.scorers.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">لا يوجد هدافون مسجلون</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
