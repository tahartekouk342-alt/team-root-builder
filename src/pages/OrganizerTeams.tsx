import { BrandLogo } from '@/components/BrandLogo';
import { useState } from 'react';
import { Bell, Search, Users, Plus, X, Camera, Loader2, Trash2, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Player { name: string; photo?: string; photoFile?: File; position?: string; number?: string; dob?: string; }

const SPORTS = [
  { v: 'football', l: 'كرة قدم', e: '⚽' },
  { v: 'basketball', l: 'كرة سلة', e: '🏀' },
  { v: 'volleyball', l: 'كرة طائرة', e: '🏐' },
];

export default function OrganizerTeams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);

  const { data: teams = [], refetch } = useQuery({
    queryKey: ['org-teams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Repository teams = teams not attached to any tournament, owned by the organizer
      const { data: rows } = await supabase.from('teams')
        .select('*').is('tournament_id', null).eq('owner_id', user.id);
      return (rows || []).map((t: any) => ({
        ...t,
        sport: t.sport_type || 'football',
        members: Array.isArray(t.player_names) ? t.player_names.length : 0,
      }));
    },
    enabled: !!user?.id,
  });

  const filtered = teams.filter((t: any) => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const sportEmoji = (s: string) => SPORTS.find(x => x.v === s)?.e || '⚽';

  const deleteTeam = async (id: string) => {
    if (!confirm('حذف هذا الفريق؟')) return;
    await supabase.from('teams').delete().eq('id', id);
    toast({ title: 'تم الحذف' });
    refetch();
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8" dir="rtl">
      <header className="h-16 px-4 lg:px-8 flex items-center justify-between bg-card border-b sticky top-0 z-30">
        <BrandLogo size="sm" />
        <h1 className="font-display text-xl font-bold tracking-wide">إدارة الفرق</h1>
        <Bell className="w-6 h-6 text-muted-foreground" />
      </header>

      <div className="p-4 space-y-3">
        <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-2">
          📦 هذه صفحة مستودع الفرق. أنشئ فرقك هنا ثم استوردها عند إنشاء أي بطولة.
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..."
              className="w-full h-11 pr-10 pl-3 rounded-lg bg-muted border text-sm" />
          </div>
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 ms-1" /> فريق
          </Button>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">لا توجد فرق</div>}
          {filtered.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover" alt="" /> : '⚽'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{sportEmoji(t.sport)}</span>
                    <span><Users className="w-3 h-3 inline" /> {t.members}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditTeam(t)} className="text-primary">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteTeam(t.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {openCreate && <CreateTeamDialog onClose={() => setOpenCreate(false)} onSaved={() => { setOpenCreate(false); refetch(); }} />}
      {editTeam && <CreateTeamDialog team={editTeam} onClose={() => setEditTeam(null)} onSaved={() => { setEditTeam(null); refetch(); }} />}
    </div>
  );
}

function CreateTeamDialog({ team, onClose, onSaved }: any) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEdit = !!team;
  const [name, setName] = useState(team?.name || '');
  const [sport, setSport] = useState(team?.sport_type || 'football');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logo_url || null);
  const [players, setPlayers] = useState<Player[]>(
    Array.isArray(team?.player_names)
      ? team.player_names.map((n: string, i: number) => ({
          name: n,
          photo: team.player_photos?.[i] || undefined,
          position: team.player_info?.[i]?.position || '',
          number: team.player_info?.[i]?.number || '',
          dob: team.player_info?.[i]?.dob || '',
        }))
      : [],
  );
  const [saving, setSaving] = useState(false);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLogoFile(f);
    const r = new FileReader(); r.onload = () => setLogoPreview(r.result as string); r.readAsDataURL(f);
  };

  const handlePlayerPhoto = (i: number, file: File) => {
    const r = new FileReader();
    r.onload = () => setPlayers(p => p.map((pp, j) => j === i ? { ...pp, photoFile: file, photo: r.result as string } : pp));
    r.readAsDataURL(file);
  };

  const upload = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('tournament-assets').upload(path, file);
    if (error) return null;
    return supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!name.trim()) return toast({ title: 'أدخل اسم الفريق', variant: 'destructive' });
    setSaving(true);
    try {
      const logoUrl = logoFile ? await upload(logoFile, 'team-logos') : (team?.logo_url || null);
      const names: string[] = []; const photos: string[] = []; const info: any[] = [];
      for (const p of players) {
        if (!p.name.trim()) continue;
        names.push(p.name);
        photos.push(p.photoFile ? (await upload(p.photoFile, 'player-photos')) || '' : (p.photo || ''));
        info.push({ name: p.name, position: p.position || '', number: p.number || '', dob: p.dob || '' });
      }
      const payload = {
        name: name.trim(), logo_url: logoUrl,
        sport_type: sport as any, player_names: names, player_photos: photos, player_info: info,
      };
      if (isEdit) {
        const { error } = await supabase.from('teams').update(payload).eq('id', team.id);
        if (error) throw error;
        toast({ title: '✅ تم تعديل الفريق' });
      } else {
        const { error } = await supabase.from('teams').insert({
          ...payload, tournament_id: null, owner_id: user?.id || null,
        } as any);
        if (error) throw error;
        toast({ title: '✅ تم إضافة الفريق' });
      }
      onSaved();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{isEdit ? 'تعديل فريق' : 'إضافة فريق'}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>

          <div className="flex justify-center">
            <label className="w-20 h-20 rounded-2xl border-2 border-dashed bg-muted/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
              {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="" /> :
                <><Camera className="w-5 h-5 text-muted-foreground" /><span className="text-[10px] mt-1">شعار</span></>}
              <input type="file" accept="image/*" onChange={handleLogo} className="sr-only" />
            </label>
          </div>

          <div><Label>اسم الفريق *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>

          <div>
            <Label>الرياضة</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {SPORTS.map(s => (
                <Card key={s.v} onClick={() => setSport(s.v)} className={`cursor-pointer ${sport === s.v ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-2 text-center"><div className="text-xl">{s.e}</div><div className="text-[11px] font-bold">{s.l}</div></CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اللاعبون ({players.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setPlayers([...players, { name: '' }])}>
                <Plus className="w-3 h-3 ms-1" /> لاعب
              </Button>
            </div>
            {players.map((p, i) => (
              <div key={i} className="p-2 rounded border bg-muted/40 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-10 h-10 rounded-full border-2 border-dashed bg-card flex items-center justify-center cursor-pointer overflow-hidden shrink-0">
                    {p.photo ? <img src={p.photo} className="w-full h-full object-cover" alt="" /> : <Camera className="w-3 h-3 text-muted-foreground" />}
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handlePlayerPhoto(i, e.target.files[0])} className="sr-only" />
                  </label>
                  <Input placeholder="اسم اللاعب" value={p.name}
                    onChange={e => setPlayers(players.map((pp, j) => j === i ? { ...pp, name: e.target.value } : pp))} />
                  <Button variant="ghost" size="icon" onClick={() => setPlayers(players.filter((_, j) => j !== i))} className="text-destructive"><X className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="المركز" value={p.position || ''}
                    onChange={e => setPlayers(players.map((pp, j) => j === i ? { ...pp, position: e.target.value } : pp))} />
                  <Input placeholder="الرقم" value={p.number || ''}
                    onChange={e => setPlayers(players.map((pp, j) => j === i ? { ...pp, number: e.target.value } : pp))} />
                  <Input type="date" value={p.dob || ''}
                    onChange={e => setPlayers(players.map((pp, j) => j === i ? { ...pp, dob: e.target.value } : pp))} />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : null} حفظ الفريق
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
