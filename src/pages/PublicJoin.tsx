import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Trophy, CheckCircle2, Users, Plus, X, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateAllMatches, shuffle, distributeIntoGroups, type DrawTeam } from '@/lib/draw';

interface Player { name: string; photo?: string; photoFile?: File; position?: string; number?: string; }

export default function PublicJoin() {
  const { id, code } = useParams<{ id?: string; code?: string }>();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<any>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [phone, setPhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => { (async () => {
    let q = supabase.from('tournaments').select('*').limit(1);
    if (code) q = q.eq('join_code', code);
    else if (id) q = q.eq('id', id);
    else { setLoading(false); return; }
    const { data } = await q.maybeSingle();
    setTournament(data);
    if (data) {
      const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true }).eq('tournament_id', data.id);
      setTeamCount(count || 0);
    }
    setLoading(false);
  })(); }, [id, code]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!tournament) return <div className="min-h-screen flex items-center justify-center text-center p-8"><div><Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p>البطولة غير موجودة</p></div></div>;

  const maxTeams = tournament.max_teams || tournament.num_teams;
  const closed = tournament.registration_closed || teamCount >= maxTeams ||
    (tournament.registration_deadline && new Date(tournament.registration_deadline) < new Date());
  const remaining = Math.max(0, maxTeams - teamCount);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLogoFile(f);
    const r = new FileReader(); r.onload = () => setLogoPreview(r.result as string); r.readAsDataURL(f);
  };

  const addPlayer = () => setPlayers([...players, { name: '' }]);
  const updatePlayer = (i: number, p: Partial<Player>) => setPlayers(players.map((pp, j) => j === i ? { ...pp, ...p } : pp));
  const removePlayer = (i: number) => setPlayers(players.filter((_, j) => j !== i));

  const handlePlayerPhoto = (i: number, file: File) => {
    const r = new FileReader();
    r.onload = () => updatePlayer(i, { photoFile: file, photo: r.result as string });
    r.readAsDataURL(file);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('tournament-assets').upload(path, file);
    if (error) return null;
    return supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
  };

  const validPhone = (p: string) => /^[\d+\s-]{6,20}$/.test(p.trim());

  const submit = async () => {
    if (!teamName.trim()) return toast({ title: 'أدخل اسم الفريق', variant: 'destructive' });
    if (!validPhone(phone)) return toast({ title: 'أدخل رقم هاتف صحيح', variant: 'destructive' });
    setSubmitting(true);
    try {
      // Anti-dupe: check phone already used for this tournament
      const cleanPhone = phone.trim();
      const { data: dupe } = await supabase.from('join_requests')
        .select('id').eq('tournament_id', tournament.id).eq('phone', cleanPhone).maybeSingle();
      if (dupe) {
        toast({ title: 'هذا الرقم مستخدم بالفعل في هذه البطولة', variant: 'destructive' });
        setSubmitting(false); return;
      }

      const logoUrl = logoFile ? await uploadFile(logoFile, 'team-logos') : null;
      const playerNames: string[] = [];
      const playerPhotos: string[] = [];
      const playerInfo: any[] = [];
      for (const p of players) {
        if (!p.name.trim()) continue;
        playerNames.push(p.name);
        const url = p.photoFile ? await uploadFile(p.photoFile, 'player-photos') : '';
        playerPhotos.push(url || '');
        playerInfo.push({ name: p.name, position: p.position || '', number: p.number || '' });
      }

      // Track phone in join_requests for dedupe
      await supabase.from('join_requests').insert({
        tournament_id: tournament.id, team_name: teamName.trim(),
        team_logo_url: logoUrl, player_names: playerNames, player_photos: playerPhotos,
        phone: cleanPhone, status: 'approved',
      } as any);

      const { error } = await supabase.from('teams').insert({
        tournament_id: tournament.id, name: teamName.trim(), logo_url: logoUrl,
        player_names: playerNames, player_photos: playerPhotos, player_info: playerInfo,
        seed: teamCount + 1,
      } as any);
      if (error) throw error;

      // Auto-close if full
      const newCount = teamCount + 1;
      if (newCount >= maxTeams) {
        await supabase.from('tournaments').update({ registration_closed: true }).eq('id', tournament.id);
        if (tournament.auto_draw !== false) {
          const { data: teams } = await supabase.from('teams').select('*').eq('tournament_id', tournament.id);
          if (teams) {
            const shuffled = shuffle(teams) as DrawTeam[];
            const groups = tournament.type === 'groups'
              ? distributeIntoGroups(shuffled, tournament.num_groups || 2) : undefined;
            await generateAllMatches({
              tournamentId: tournament.id, type: tournament.type, teams: shuffled,
              legs: tournament.league_legs || 1, groups,
            });
            await supabase.from('tournaments').update({ status: 'live' as any }).eq('id', tournament.id);
          }
        }
      }
      setSuccess(true);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 mx-auto text-success" />
          <h2 className="font-bold text-xl">تم تسجيل فريقك بنجاح!</h2>
          <p className="text-sm text-muted-foreground">سيتم إبلاغك بمواعيد المباريات قريباً.</p>
        </CardContent></Card>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center space-y-3">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="font-bold">التسجيل مغلق</h2>
          <p className="text-sm text-muted-foreground">{tournament.name}</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-12" dir="rtl">
      <div className="max-w-xl mx-auto space-y-4">
        <Card><CardContent className="p-5 space-y-2 text-center">
          {tournament.logo_url
            ? <img src={tournament.logo_url} className="w-20 h-20 mx-auto rounded-2xl object-cover ring-4 ring-primary/20" alt="" />
            : <img src="/icon-512.png" className="w-20 h-20 mx-auto rounded-2xl" alt="Bottolat" />}
          <h1 className="font-display text-2xl font-bold">{tournament.name}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" /> {teamCount} / {maxTeams} فرق · باق {remaining}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-4">
          <h2 className="font-bold">سجّل فريقك</h2>
          <div className="flex justify-center">
            <label className="w-20 h-20 rounded-2xl border-2 border-dashed bg-muted/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
              {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="" /> :
                <><Camera className="w-5 h-5 text-muted-foreground" /><span className="text-[10px] mt-1">شعار</span></>}
              <input type="file" accept="image/*" onChange={handleLogo} className="sr-only" />
            </label>
          </div>
          <div><Label>اسم الفريق *</Label><Input value={teamName} onChange={e => setTeamName(e.target.value)} /></div>
          <div>
            <Label className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> رقم الهاتف *</Label>
            <Input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="مثال: 0612345678" />
            <p className="text-[11px] text-muted-foreground mt-1">يُستخدم لمنع التسجيل المكرر — لن يُنشر علناً.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اللاعبون ({players.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPlayer}><Plus className="w-3 h-3 ms-1" />إضافة لاعب</Button>
            </div>
            {players.map((p, i) => (
              <div key={i} className="p-3 rounded border bg-muted/40 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-12 h-12 rounded-full border-2 border-dashed bg-card flex items-center justify-center cursor-pointer overflow-hidden shrink-0">
                    {p.photo ? <img src={p.photo} className="w-full h-full object-cover" alt="" /> : <Camera className="w-4 h-4 text-muted-foreground" />}
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handlePlayerPhoto(i, e.target.files[0])} className="sr-only" />
                  </label>
                  <Input placeholder="اسم اللاعب" value={p.name} onChange={e => updatePlayer(i, { name: e.target.value })} />
                  <Button variant="ghost" size="icon" onClick={() => removePlayer(i)} className="text-destructive"><X className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="المركز" value={p.position || ''} onChange={e => updatePlayer(i, { position: e.target.value })} />
                  <Input placeholder="الرقم" value={p.number || ''} onChange={e => updatePlayer(i, { number: e.target.value })} />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full bg-primary text-primary-foreground">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : null} تسجيل الفريق
          </Button>
        </CardContent></Card>
      </div>
    </div>
  );
}
