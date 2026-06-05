import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Wand2, Loader2, Image as ImageIcon, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Player {
  id: string;
  name: string;
  number?: string;
  team_id?: string;
  photo_url?: string;
  photo_preview?: string;
  photo_file?: File;
}

interface AddPlayersWithPhotosProps {
  teamId: string;
  teamName: string;
  onPlayersAdded: (players: Player[]) => void;
  maxPlayers?: number;
  loading?: boolean;
}

export function AddPlayersWithPhotos({
  teamId,
  teamName,
  onPlayersAdded,
  maxPlayers = 23,
  loading = false,
}: AddPlayersWithPhotosProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [generatingPhotos, setGeneratingPhotos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    if (players.length >= maxPlayers) {
      toast({ title: 'خطأ', description: `الحد الأقصى للاعبين هو ${maxPlayers}`, variant: 'destructive' });
      return;
    }
    if (players.some(p => p.name.toLowerCase() === newPlayerName.toLowerCase())) {
      toast({ title: 'خطأ', description: 'هذا اللاعب موجود بالفعل', variant: 'destructive' });
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      number: newPlayerNumber || undefined,
      team_id: teamId,
    };
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setNewPlayerNumber('');
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handlePhotoSelect = (playerId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPlayers(players.map(p => 
        p.id === playerId 
          ? { ...p, photo_file: file, photo_preview: reader.result as string }
          : p
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePhoto = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setGeneratingPhotos(prev => new Set([...prev, playerId]));
    try {
      // Call AI image generation API for player portrait
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Professional portrait of a football/soccer player named "${player.name}" wearing ${teamName} team jersey. High quality, realistic, PNG format, suitable for sports team roster.`,
          n: 1,
          size: '256x256',
          quality: 'hd',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate photo');
      
      const data = await response.json();
      const imageUrl = data.data[0].url;

      // Download and set the image
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      const file = new File([blob], `${player.name}-photo.png`, { type: 'image/png' });
      
      handlePhotoSelect(playerId, file);
      toast({ title: 'تم بنجاح', description: 'تم توليد صورة اللاعب بالذكاء الاصطناعي' });
    } catch (error) {
      console.error('Error generating photo:', error);
      toast({ title: 'خطأ', description: 'فشل في توليد الصورة', variant: 'destructive' });
    } finally {
      setGeneratingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  const handleSavePlayers = async () => {
    if (players.length === 0) {
      toast({ title: 'خطأ', description: 'أضف لاعباً واحداً على الأقل', variant: 'destructive' });
      return;
    }

    // Upload photos for players that have them
    const playersWithPhotos = await Promise.all(
      players.map(async (player) => {
        let photoUrl = player.photo_url;
        
        if (player.photo_file && !photoUrl) {
          try {
            const fileExt = player.photo_file.name.split('.').pop();
            const filePath = `player-photos/${teamId}/${Date.now()}-${player.id}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('tournament-assets')
              .upload(filePath, player.photo_file);
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('tournament-assets')
                .getPublicUrl(filePath);
              photoUrl = publicUrl;
            }
          } catch (error) {
            console.error('Error uploading photo:', error);
          }
        }

        return {
          id: player.id,
          name: player.name,
          number: player.number || null,
          photo_url: photoUrl || null,
          team_id: teamId,
        };
      })
    );

    onPlayersAdded(playersWithPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Add Player Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="اسم اللاعب"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            disabled={loading}
            className="flex-1"
          />
          <Input
            placeholder="الرقم"
            type="number"
            min="1"
            max="99"
            value={newPlayerNumber}
            onChange={(e) => setNewPlayerNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            disabled={loading}
            className="w-20"
          />
          <Button onClick={handleAddPlayer} disabled={loading || players.length >= maxPlayers}>
            إضافة لاعب
          </Button>
        </div>
      </div>

      {/* Players List */}
      {players.length > 0 && (
        <div className="space-y-3">
          {players.map((player) => (
            <Card key={player.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Photo Upload Area */}
                  <div className="relative">
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group">
                      {player.photo_preview ? (
                        <img src={player.photo_preview} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] text-muted-foreground text-center">صورة</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handlePhotoSelect(player.id, e.target.files[0])}
                        className="sr-only"
                        disabled={loading}
                      />
                    </label>
                    {player.number && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border-2 border-background">
                        {player.number}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{player.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {player.photo_preview ? '✓ صورة مرفوعة' : 'بدون صورة'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePhoto(player.id)}
                      disabled={loading || generatingPhotos.has(player.id)}
                      className="gap-1"
                    >
                      {generatingPhotos.has(player.id) ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="hidden sm:inline text-xs">جاري...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" />
                          <span className="hidden sm:inline text-xs">AI</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlayer(player.id)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
        <span className="text-sm text-muted-foreground">
          عدد اللاعبين: <span className="font-bold text-foreground">{players.length}</span> / {maxPlayers}
        </span>
        <Button
          onClick={handleSavePlayers}
          disabled={loading || players.length === 0}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              حفظ اللاعبين
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
