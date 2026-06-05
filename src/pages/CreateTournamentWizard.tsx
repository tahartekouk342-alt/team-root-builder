import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Trophy, Users, Sparkles, Link2, Copy, Check, Camera, Download } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';
import { DrawDisplay } from '@/components/tournament/DrawDisplay';
import { generateAllMatches, generateJoinCode, type DrawTeam } from '@/lib/draw';

type SportType = 'football' | 'basketball' | 'volleyball';
type TType = 'knockout' | 'league' | 'groups';

const SPORTS: { v: SportType; l: string; e: string }[] = [
  { v: 'football', l: 'كرة قدم', e: '⚽' },
  { v: 'basketball', l: 'كرة سلة', e: '🏀' },
  { v: 'volleyball', l: 'كرة طائرة', e: '🏐' },
];

const TYPES: { v: TType; l: string; d: string }[] = [
  { v: 'knockout', l: 'خروج المغلوب', d: 'الفائز يتأهل، الخاسر يقصى' },
  { v: 'league', l: 'دوري', d: 'كل فريق يلعب ضد جميع الخصوم' },
  { v: 'groups', l: 'مجموعات', d: 'مجموعات ثم إقصاء' },
];

export default function CreateTournamentWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // info
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType>('football');
  const [type, setType] = useState<TType>('knockout');
  const [startDate, setStartDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // registration
  const [regMode, setRegMode] = useState<'import' | 'open'>('import');
  const [maxTeams, setMaxTeams] = useState(8);
  const [deadline, setDeadline] = useState('');
  const [numGroups, setNumGroups] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [legs, setLegs] = useState<1 | 2>(1);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  // teams (import from repository)
  const [repoTeams, setRepoTeams] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // draw
  const [drawTeams, setDrawTeams] = useState<DrawTeam[]>([]);

  // Load repository teams (teams not attached to any tournament)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('teams').select('*')
        .is('tournament_id', null).eq('owner_id', user?.id || null);
      setRepoTeams(data || []);
    })();
  }, [user?.id]);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLogoFile(f);
    const r = new FileReader(); r.onload = () => setLogoPreview(r.result as string); r.readAsDataURL(f);
  };

  const goRegistration = () => {
    if (!name.trim()) return toast({ title: 'أدخل اسم البطولة', variant: 'destructive' });
    setTab('registration');
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = logoFile.name.split('.').pop();
    const path = `logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('tournament-assets').upload(path, logoFile);
    if (error) return null;
    return supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
  };

  const createOpenTournament = async () => {
    setLoading(true);
    try {
      const logoUrl = await uploadLogo();
      const code = generateJoinCode();
      const { data, error } = await supabase.from('tournaments').insert({
        name, type, sport_type: sport, status: 'draft',
        start_date: startDate || null, venue_name: venueName || null,
        num_teams: maxTeams, max_teams: maxTeams,
        is_open: true, registration_deadline: deadline || null,
        accept_join_requests: true, logo_url: logoUrl,
        num_groups: numGroups, league_legs: legs,
        qualifiers_per_group: qualifiersPerGroup,
        join_code: code,
        owner_id: user?.id || null,
      } as any).select().single();
      if (error) throw error;
      setCreatedId(data.id);
      setJoinCode(code);
      toast({ title: '✅ تم إنشاء البطولة المفتوحة' });
      setTab('share');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const goToTeams = () => setTab('teams');

  const toggleTeam = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= maxTeams) {
        toast({ title: `الحد الأقصى ${maxTeams} فرق`, variant: 'destructive' });
        return prev;
      }
      return [...prev, id];
    });
  };

  const goToDraw = async () => {
    if (selectedIds.length < 2) return toast({ title: 'اختر فريقين على الأقل', variant: 'destructive' });
    setLoading(true);
    try {
      const logoUrl = await uploadLogo();
      const { data: t, error } = await supabase.from('tournaments').insert({
        name, type, sport_type: sport, status: 'draft',
        start_date: startDate || null, venue_name: venueName || null,
        num_teams: selectedIds.length, logo_url: logoUrl,
        num_groups: numGroups, league_legs: legs,
        qualifiers_per_group: qualifiersPerGroup,
        owner_id: user?.id || null,
      } as any).select().single();
      if (error) throw error;
      setCreatedId(t.id);
      const chosen = repoTeams.filter(rt => selectedIds.includes(rt.id));
      const { data: teams } = await supabase.from('teams').insert(
        chosen.map((rt, i) => ({
          tournament_id: t.id, name: rt.name, logo_url: rt.logo_url || null,
          sport_type: rt.sport_type || sport,
          player_names: rt.player_names || [], player_photos: rt.player_photos || [],
          player_info: rt.player_info || [], seed: i + 1,
        })),
      ).select();
      setDrawTeams((teams || []) as any);
      setTab('draw');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const confirmDraw = async ({ ordered, groups }: { ordered: DrawTeam[]; groups?: Record<string, DrawTeam[]> }) => {
    if (!createdId) return;
    setLoading(true);
    try {
      await generateAllMatches({
        tournamentId: createdId, type, teams: ordered, legs, groups,
      });
      await supabase.from('tournaments').update({ status: 'live' as any }).eq('id', createdId);
      toast({ title: '🎉 تم إنشاء البطولة وإجراء القرعة' });
      navigate(`${ORGANIZER_BASE}/tournament/${createdId}`);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const joinUrl = joinCode ? `${window.location.origin}/j/${joinCode}` : (createdId ? `${window.location.origin}/join/${createdId}` : '');
  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <header className="h-14 px-4 flex items-center gap-3 border-b bg-card sticky top-0 z-30">
        <Button size="sm" variant="ghost" onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}>
          <ArrowRight className="w-4 h-4 ms-1" /> رجوع
        </Button>
        <h1 className="font-bold flex-1">بطولة جديدة</h1>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="p-4">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="registration" disabled={!name}>التسجيل</TabsTrigger>
          <TabsTrigger value="teams" disabled={regMode !== 'import' || !createdId && tab !== 'teams'}>الفرق</TabsTrigger>
          <TabsTrigger value="draw" disabled={!drawTeams.length}>القرعة</TabsTrigger>
        </TabsList>

        {/* --- INFO --- */}
        <TabsContent value="info" className="space-y-4">
          <Card><CardContent className="p-4 space-y-4">
            <div className="flex justify-center">
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed bg-muted/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="" />
                  : <><Camera className="w-6 h-6 text-muted-foreground" /><span className="text-xs text-muted-foreground mt-1">شعار</span></>}
                <input type="file" accept="image/*" onChange={handleLogo} className="sr-only" />
              </label>
            </div>
            <div><Label>اسم البطولة *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="بطولة الربيع" /></div>
            <div>
              <Label>الرياضة</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {SPORTS.map(s => (
                  <Card key={s.v} onClick={() => setSport(s.v)}
                    className={`cursor-pointer ${sport === s.v ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center"><div className="text-2xl">{s.e}</div><div className="text-xs font-bold">{s.l}</div></CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <Label>نوع البطولة</Label>
              <div className="grid gap-2 mt-2">
                {TYPES.map(tt => (
                  <Card key={tt.v} onClick={() => setType(tt.v)}
                    className={`cursor-pointer ${type === tt.v ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3"><div className="font-bold text-sm">{tt.l}</div><div className="text-xs text-muted-foreground">{tt.d}</div></CardContent>
                  </Card>
                ))}
              </div>
            </div>
            {type === 'groups' && (
              <div className="grid grid-cols-2 gap-2">
                <div><Label>عدد المجموعات</Label><Input type="number" min={2} max={8} value={numGroups} onChange={e => setNumGroups(parseInt(e.target.value) || 2)} /></div>
                <div><Label>المتأهلون من كل مجموعة</Label><Input type="number" min={1} max={4} value={qualifiersPerGroup} onChange={e => setQualifiersPerGroup(parseInt(e.target.value) || 2)} /></div>
              </div>
            )}
            {type === 'league' && (
              <div>
                <Label>عدد الدورات</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[1, 2].map(n => (
                    <Card key={n} onClick={() => setLegs(n as 1 | 2)}
                      className={`cursor-pointer ${legs === n ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-3 text-center text-sm font-bold">{n === 1 ? 'ذهاب فقط' : 'ذهاب وإياب'}</CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><Label>تاريخ البداية</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><Label>الملعب</Label><Input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="اسم الملعب" /></div>
            </div>
            <Button onClick={goRegistration} className="w-full bg-primary text-primary-foreground">التالي: طريقة التسجيل</Button>
          </CardContent></Card>
        </TabsContent>

        {/* --- REGISTRATION --- */}
        <TabsContent value="registration" className="space-y-4">
          <Card><CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Card onClick={() => setRegMode('import')} className={`cursor-pointer ${regMode === 'import' ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="font-bold text-sm">استيراد الفرق</div><div className="text-xs text-muted-foreground">أضف الفرق بنفسك</div></CardContent>
              </Card>
              <Card onClick={() => setRegMode('open')} className={`cursor-pointer ${regMode === 'open' ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center"><Link2 className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="font-bold text-sm">بطولة مفتوحة</div><div className="text-xs text-muted-foreground">رابط للتسجيل</div></CardContent>
              </Card>
            </div>
            <div><Label>الحد الأقصى للفرق</Label><Input type="number" min={2} max={64} value={maxTeams} onChange={e => setMaxTeams(parseInt(e.target.value) || 8)} /></div>
            {regMode === 'open' && (
              <>
                <div><Label>تاريخ إغلاق التسجيل (اختياري)</Label><Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
                <div className="p-3 rounded bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                  عند اكتمال العدد <strong>{maxTeams}</strong> سيُغلق التسجيل تلقائياً. حسب الإعدادات قد تُجرى القرعة وتُولّد المباريات تلقائياً.
                </div>
                <Button onClick={createOpenTournament} disabled={loading} className="w-full bg-primary text-primary-foreground">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Link2 className="w-4 h-4 ms-2" />}
                  إنشاء البطولة وتوليد الرابط
                </Button>
              </>
            )}
            {regMode === 'import' && (
              <Button onClick={goToTeams} className="w-full bg-primary text-primary-foreground">التالي: إضافة الفرق</Button>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* --- SHARE LINK (after open tournament created) --- */}
        <TabsContent value="share" className="space-y-4">
          <Card><CardContent className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Link2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-bold text-lg">رابط التسجيل جاهز</h2>
            <p className="text-sm text-muted-foreground">شارك هذا الرابط مع الفرق لتسجيلها في البطولة</p>
            <div className="flex gap-2">
              <Input readOnly value={joinUrl} className="text-xs" />
              <Button onClick={copyLink} variant="outline" size="icon">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${createdId}`)} className="w-full bg-primary text-primary-foreground">
              الذهاب لإدارة البطولة
            </Button>
          </CardContent></Card>
        </TabsContent>

        {/* --- TEAMS (import) --- */}
        <TabsContent value="teams" className="space-y-4">
          <Card><CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input placeholder="اسم الفريق" value={newTeam} onChange={e => setNewTeam(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTeamName()} />
              <Button onClick={addTeamName}>إضافة</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {teamsList.map((tn, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                  <span className="truncate">{i + 1}. {tn}</span>
                  <button onClick={() => setTeamsList(teamsList.filter((_, j) => j !== i))} className="text-destructive text-xs">حذف</button>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{teamsList.length} / {maxTeams} فرق</div>
            <Button onClick={goToDraw} disabled={loading || teamsList.length < 2} className="w-full bg-primary text-primary-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Sparkles className="w-4 h-4 ms-2" />}
              التالي: القرعة
            </Button>
          </CardContent></Card>
        </TabsContent>

        {/* --- DRAW --- */}
        <TabsContent value="draw">
          {drawTeams.length > 0 && (
            <Card><CardContent className="p-4">
              <DrawDisplay teams={drawTeams} type={type} numGroups={numGroups} onConfirm={confirmDraw} />
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
