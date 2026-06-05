import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2, Plus, X, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo_url?: string;
  photoFile?: File;
  isNew?: boolean;
}

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  teamLogoUrl?: string;
  onSave?: () => void;
}

const POSITIONS: Record<string, string> = {
  goalkeeper: '🧤 حارس مرمى',
  defender: '🛡️ دفاع',
  midfielder: '⚽ وسط',
  forward: '⚔️ هجوم',
};

export function EditTeamDialog({
  open, onOpenChange, teamId, teamName, teamLogoUrl, onSave,
}: EditTeamDialogProps) {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(teamLogoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({
    number: 1,
    position: 'midfielder',
  });
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState<string | null>(null);
  const [newPlayerPhotoFile, setNewPlayerPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTeamData();
    }
  }, [open, teamId]);

  const fetchTeamData = async () => {
    try {
      setFetching(true);
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (team) {
        setLogoPreview(team.logo_url || null);
      }

      // Fetch players from the players table
      const { data: playersData } = await supabase
        .from('players' as any)
        .select('*')
        .eq('team_id', teamId)
        .order('number');

      if (playersData && Array.isArray(playersData)) {
        setPlayers((playersData as any[]).map((p: any) => ({
          id: p.id,
          name: p.name,
          number: p.number,
          position: p.position,
          photo_url: p.photo_url,
        })));
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setPlayers([]);
    } finally {
      setFetching(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePlayerPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPlayerPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setNewPlayerPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = () => {
    if (!newPlayer.name?.trim()) {
      toast({ title: 'يرجى إدخال اسم اللاعب', variant: 'destructive' });
      return;
    }

    if (players.some(p => p.number === newPlayer.number)) {
      toast({ title: 'رقم القميص موجود بالفعل', variant: 'destructive' });
      return;
    }

    const player: Player = {
      id: `new-${Date.now()}`,
      name: newPlayer.name.trim(),
      number: newPlayer.number || 1,
      position: newPlayer.position || 'midfielder',
      photo_url: newPlayerPhotoPreview || undefined,
      photoFile: newPlayerPhotoFile || undefined,
      isNew: true,
    };

    setPlayers(prev => [...prev, player]);
    setNewPlayer({ number: Math.max(...players.map(p => p.number), 0) + 1, position: 'midfielder' });
    setNewPlayerPhotoPreview(null);
    setNewPlayerPhotoFile(null);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update team logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `team-logos/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, logoFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
          await supabase.from('teams').update({ logo_url: publicUrl }).eq('id', teamId);
        }
      }

      // Save players
      for (const player of players) {
        let photoUrl = player.photo_url;

        if (player.photoFile) {
          const fileExt = player.photoFile.name.split('.').pop();
          const filePath = `player-photos/${Date.now()}-${player.id}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, player.photoFile);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
            photoUrl = publicUrl;
          }
        }

        if (player.isNew) {
          await (supabase.from('players' as any) as any).insert({
            team_id: teamId,
            name: player.name,
            number: player.number,
            position: player.position,
            photo_url: photoUrl || null,
          });
        } else {
          await (supabase.from('players' as any) as any).update({
            name: player.name,
            number: player.number,
            position: player.position,
            photo_url: photoUrl || null,
          }).eq('id', player.id);
        }
      }

      toast({ title: 'تم حفظ التغييرات بنجاح ✅' });
      onOpenChange(false);
      onSave?.();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الفريق</DialogTitle>
          <DialogDescription>{teamName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Logo */}
          <div className="flex flex-col items-center gap-3">
            <Label>شعار الفريق</Label>
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="شعار" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">شعار الفريق</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleLogoSelect} className="sr-only" />
            </label>
          </div>

          {/* Players Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">اللاعبون ({players.length})</h3>

            {/* Add New Player */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30 mb-4">
              <div className="flex justify-center">
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                  {newPlayerPhotoPreview ? (
                    <img src={newPlayerPhotoPreview} alt="صورة" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-muted-foreground mb-0.5" />
                      <span className="text-[10px] text-muted-foreground">صورة</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePlayerPhotoSelect} className="sr-only" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">اسم اللاعب</Label>
                  <Input
                    placeholder="الاسم"
                    value={newPlayer.name || ''}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">رقم القميص</Label>
                  <Input
                    type="number" min="1" max="99" placeholder="1-99"
                    value={newPlayer.number || ''}
                    onChange={(e) => setNewPlayer(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">المركز</Label>
                <Select value={newPlayer.position || 'midfielder'} onValueChange={(v) => setNewPlayer(prev => ({ ...prev, position: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">🧤 حارس مرمى</SelectItem>
                    <SelectItem value="defender">🛡️ دفاع</SelectItem>
                    <SelectItem value="midfielder">⚽ وسط</SelectItem>
                    <SelectItem value="forward">⚔️ هجوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddPlayer} className="w-full" size="sm">
                <Plus className="w-4 h-4 ml-2" />إضافة اللاعب
              </Button>
            </div>

            {/* Players List */}
            {players.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={player.photo_url} alt={player.name} />
                      <AvatarFallback>{player.number}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">#{player.number} • {POSITIONS[player.position] || player.position}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 gradient-primary text-primary-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}