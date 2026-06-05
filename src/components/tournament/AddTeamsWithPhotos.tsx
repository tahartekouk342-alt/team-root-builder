import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  logo_preview?: string;
  logo_file?: File;
}

interface AddTeamsWithPhotosProps {
  onTeamsAdded: (teams: Team[]) => void;
  maxTeams: number;
  loading?: boolean;
}

export function AddTeamsWithPhotos({ onTeamsAdded, maxTeams, loading = false }: AddTeamsWithPhotosProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [generatingLogos, setGeneratingLogos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    if (teams.length >= maxTeams) {
      toast({ title: 'خطأ', description: `الحد الأقصى للفرق هو ${maxTeams}`, variant: 'destructive' });
      return;
    }
    if (teams.some(t => t.name.toLowerCase() === newTeamName.toLowerCase())) {
      toast({ title: 'خطأ', description: 'هذا الفريق موجود بالفعل', variant: 'destructive' });
      return;
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName.trim(),
    };
    setTeams([...teams, newTeam]);
    setNewTeamName('');
  };

  const handleRemoveTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const handleLogoSelect = (teamId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, logo_file: file, logo_preview: reader.result as string }
          : t
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateLogo = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setGeneratingLogos(prev => new Set([...prev, teamId]));
    try {
      // Call AI image generation API
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create a professional sports team logo for "${team.name}". Modern, clean design, suitable for a football/soccer team. High quality, PNG format.`,
          n: 1,
          size: '256x256',
          quality: 'hd',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate logo');
      
      const data = await response.json();
      const imageUrl = data.data[0].url;

      // Download and set the image
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      const file = new File([blob], `${team.name}-logo.png`, { type: 'image/png' });
      
      handleLogoSelect(teamId, file);
      toast({ title: 'تم بنجاح', description: 'تم توليد الشعار بالذكاء الاصطناعي' });
    } catch (error) {
      console.error('Error generating logo:', error);
      toast({ title: 'خطأ', description: 'فشل في توليد الشعار', variant: 'destructive' });
    } finally {
      setGeneratingLogos(prev => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }
  };

  const handleSaveTeams = async () => {
    if (teams.length === 0) {
      toast({ title: 'خطأ', description: 'أضف فريقاً واحداً على الأقل', variant: 'destructive' });
      return;
    }

    // Upload logos for teams that have them
    const teamsWithLogos = await Promise.all(
      teams.map(async (team) => {
        let logoUrl = team.logo_url;
        
        if (team.logo_file && !logoUrl) {
          try {
            const fileExt = team.logo_file.name.split('.').pop();
            const filePath = `team-logos/${Date.now()}-${team.id}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('tournament-assets')
              .upload(filePath, team.logo_file);
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('tournament-assets')
                .getPublicUrl(filePath);
              logoUrl = publicUrl;
            }
          } catch (error) {
            console.error('Error uploading logo:', error);
          }
        }

        return {
          id: team.id,
          name: team.name,
          logo_url: logoUrl || null,
        };
      })
    );

    onTeamsAdded(teamsWithLogos);
  };

  return (
    <div className="space-y-4">
      {/* Add Team Input */}
      <div className="flex gap-2">
        <Input
          placeholder="اسم الفريق"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
          disabled={loading}
        />
        <Button onClick={handleAddTeam} disabled={loading || teams.length >= maxTeams}>
          إضافة فريق
        </Button>
      </div>

      {/* Teams List */}
      {teams.length > 0 && (
        <div className="space-y-3">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Logo Upload Area */}
                  <div className="relative">
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group">
                      {team.logo_preview ? (
                        <img src={team.logo_preview} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] text-muted-foreground text-center">شعار</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleLogoSelect(team.id, e.target.files[0])}
                        className="sr-only"
                        disabled={loading}
                      />
                    </label>
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {team.logo_preview ? '✓ شعار مرفوع' : 'بدون شعار'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateLogo(team.id)}
                      disabled={loading || generatingLogos.has(team.id)}
                      className="gap-1"
                    >
                      {generatingLogos.has(team.id) ? (
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
                      onClick={() => handleRemoveTeam(team.id)}
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
          عدد الفرق: <span className="font-bold text-foreground">{teams.length}</span> / {maxTeams}
        </span>
        <Button
          onClick={handleSaveTeams}
          disabled={loading || teams.length === 0}
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
              حفظ الفرق
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
