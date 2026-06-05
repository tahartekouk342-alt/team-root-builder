import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Users, ListChecks, Trash2, MapPin, Copy, Check, Link2, Dice5, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTournamentDetails } from '@/hooks/useTournamentDetails';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { BracketView } from '@/components/tournament/BracketView';
import { DrawDisplay } from '@/components/tournament/DrawDisplay';
import { generateAllMatches, generateKnockoutFromGroups, type DrawTeam } from '@/lib/draw';
import { UpdateMatchDialog } from '@/components/tournament/UpdateMatchDialog';

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tournament, teams, matches, standings, loading, fetchTournamentDetails, getMatchesByRound, getRoundName } = useTournamentDetails(id);
  const { deleteTournament, updateMatchResult } = useTournaments();
  const [showDraw, setShowDraw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMatch, setEditMatch] = useState<any>(null);
  const [drawing, setDrawing] = useState(false);

  if (loading) return <div className="p-8"><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-96" /></div>;
  if (!tournament) return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold mb-4">البطولة غير موجودة</h1>
      <Button onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}><ArrowRight className="w-4 h-4 ms-1" />العودة</Button>
    </div>
  );

  const isLeagueOrGroups = tournament.type === 'league' || tournament.type === 'groups';
  const joinUrl = (tournament as any).join_code
    ? `${window.location.origin}/j/${(tournament as any).join_code}`
    : `${window.location.origin}/join/${tournament.id}`;
  const isOpen = (tournament as any).is_open;
  const closed = (tournament as any).registration_closed;

  const handleDelete = async () => {
    if (confirm('هل أنت متأكد من حذف البطولة؟')) {
      const ok = await deleteTournament(id!);
      if (ok) navigate(`${ORGANIZER_BASE}/tournaments`);
    }
  };

  const runDraw = async (result: { ordered: DrawTeam[]; groups?: Record<string, DrawTeam[]> }) => {
    setDrawing(true);
    try {
      await generateAllMatches({
        tournamentId: id!, type: tournament.type as any, teams: result.ordered,
        legs: tournament.league_legs || 1, groups: result.groups,
      });
      await supabase.from('tournaments').update({ status: 'live' as any }).eq('id', id!);
      toast({ title: '🎉 تم إجراء القرعة وتوليد المباريات' });
      setShowDraw(false);
      fetchTournamentDetails();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setDrawing(false); }
  };

  const copyLink = () => { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <div className="relative h-40">
        <img src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-background" />
        <Button size="sm" onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}
          className="absolute top-3 right-3 bg-black/40 text-white backdrop-blur"><ArrowRight className="w-4 h-4 ms-1" />رجوع</Button>
        <Button size="sm" variant="destructive" onClick={handleDelete} className="absolute top-3 left-3"><Trash2 className="w-4 h-4" /></Button>
        <div className="absolute bottom-3 right-4 left-4 text-white">
          <h1 className="text-xl font-bold drop-shadow">{tournament.name}</h1>
          <p className="text-sm opacity-90">{teams.length} فريق · {matches.length} مباراة</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Open tournament banner */}
        {isOpen && !closed && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold"><Link2 className="w-4 h-4 text-primary" /> رابط التسجيل العام</div>
              <div className="flex gap-2">
                <input readOnly value={joinUrl} className="flex-1 px-3 py-2 text-xs rounded border bg-card" />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {teams.length} / {(tournament as any).max_teams || tournament.num_teams} مسجل
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draw trigger when there are teams but no matches */}
        {teams.length >= 2 && matches.length === 0 && !showDraw && (
          <Button onClick={() => setShowDraw(true)} className="w-full bg-primary text-primary-foreground">
            <Dice5 className="w-4 h-4 ms-2" /> إجراء القرعة وتوليد المباريات
          </Button>
        )}
        {/* Start knockout from groups */}
        {tournament.type === 'groups' && matches.some((m: any) => m.group_name) &&
         !matches.some((m: any) => m.stage === 'knockout') && (
          <Button variant="outline" className="w-full" onClick={async () => {
            try {
              const n = await generateKnockoutFromGroups({
                tournamentId: id!,
                qualifiersPerGroup: (tournament as any).qualifiers_per_group || 2,
              });
              toast({ title: `🔥 انطلق دور الإقصاء — ${n} مباراة` });
              fetchTournamentDetails();
            } catch (e: any) {
              toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
            }
          }}>
            <Trophy className="w-4 h-4 ms-2" /> بدء دور الإقصاء من المجموعات
          </Button>
        )}
        {showDraw && (
          <Card><CardContent className="p-4">
            {drawing ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              : <DrawDisplay teams={teams as any} type={tournament.type as any} numGroups={tournament.num_groups || 2} onConfirm={runDraw} />}
            <Button variant="ghost" size="sm" onClick={() => setShowDraw(false)} className="w-full mt-2">إلغاء</Button>
          </CardContent></Card>
        )}

        <Tabs defaultValue={isLeagueOrGroups ? 'standings' : 'bracket'} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value={isLeagueOrGroups ? 'standings' : 'bracket'}>
              {isLeagueOrGroups ? <><Trophy className="w-4 h-4 ms-1" />الترتيب</> : <><Trophy className="w-4 h-4 ms-1" />الإقصاء</>}
            </TabsTrigger>
            <TabsTrigger value="teams"><Users className="w-4 h-4 ms-1" />الفرق</TabsTrigger>
            <TabsTrigger value="matches"><ListChecks className="w-4 h-4 ms-1" />المباريات</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="mt-4">
            {standings.length > 0 ? (
              <StandingsTable standings={standings.map((s: any, i: number) => {
                const team = teams.find((t: any) => t.id === s.team_id);
                return {
                  position: s.position || i + 1,
                  name: team?.name || '?',
                  played: s.played || 0, won: s.won || 0, drawn: s.drawn || 0, lost: s.lost || 0,
                  goalsFor: s.goals_for || 0, goalsAgainst: s.goals_against || 0,
                  goalDifference: s.goal_difference || 0, points: s.points || 0,
                };
              })} />
            ) : <p className="text-center text-sm text-muted-foreground py-8">لا يوجد ترتيب بعد. أجرِ القرعة أولاً.</p>}
          </TabsContent>

          <TabsContent value="bracket" className="mt-4">
            {matches.length > 0
              ? <BracketView matches={matches} getRoundName={getRoundName} onMatchClick={setEditMatch as any} />
              : <p className="text-center text-sm text-muted-foreground py-8">لا توجد مباريات بعد.</p>}
          </TabsContent>

          <TabsContent value="teams" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-8">لا توجد فرق</p>}
              {teams.map(t => {
                const teamMatches = matches.filter((m: any) => m.home_team_id === t.id || m.away_team_id === t.id);
                const showOpponents = tournament.type === 'league' || tournament.type === 'groups';
                return (
                  <Card key={t.id}><CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-primary/20">
                        {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover" alt="" /> : '⚽'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(t as any).player_names?.length || 0} لاعب
                          {t.group_name && <span> · مجموعة {t.group_name}</span>}
                        </div>
                      </div>
                    </div>
                    {showOpponents && teamMatches.length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary font-semibold py-1">الخصوم ({teamMatches.length})</summary>
                        <ul className="mt-1 space-y-1">
                          {teamMatches.map((m: any) => {
                            const opp = m.home_team_id === t.id ? m.away_team : m.home_team;
                            return (
                              <li key={m.id} className="flex items-center justify-between p-1.5 rounded bg-muted/50">
                                <span className="truncate">vs {opp?.name || '?'}</span>
                                <span className="text-[10px]">
                                  {m.status === 'completed'
                                    ? `${m.home_team_id === t.id ? m.home_score : m.away_score} - ${m.home_team_id === t.id ? m.away_score : m.home_score}`
                                    : `جولة ${m.round}`}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    )}
                  </CardContent></Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="matches" className="mt-4 space-y-2">
            {matches.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">لا توجد مباريات</p>}
            {matches.map(m => (
              <Card key={m.id} onClick={() => setEditMatch(m)} className="cursor-pointer hover:border-primary/50">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 items-center gap-2">
                    <div className="text-end font-medium truncate text-sm">{m.home_team?.name || '?'}</div>
                    <div className="text-center">
                      {m.status === 'completed'
                        ? <div className="text-lg font-bold tabular-nums">{m.home_score} - {m.away_score}</div>
                        : <div className="text-xs font-bold text-muted-foreground">VS</div>}
                      <div className="text-[10px] text-muted-foreground">
                        {m.group_name ? `مجموعة ${m.group_name}` : `جولة ${m.round}`}
                      </div>
                    </div>
                    <div className="text-start font-medium truncate text-sm">{m.away_team?.name || '?'}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {editMatch && (
        <UpdateMatchDialog
          match={editMatch} open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)}
          tournamentType={tournament.type} sportType={tournament.sport_type || 'football'}
          volleyballFormat={(tournament as any).volleyball_format}
          onUpdate={async (mid, hs, as, mom, sets) => {
            const ok = await updateMatchResult(mid, hs, as, mom, sets);
            if (ok) fetchTournamentDetails();
            return !!ok;
          }}
        />
      )}
    </div>
  );
}
