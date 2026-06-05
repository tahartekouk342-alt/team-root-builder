import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditTournamentDialogProps {
  tournament: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTournamentDialog({ tournament, open, onOpenChange }: EditTournamentDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [refereeName, setRefereeName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stadiumFile, setStadiumFile] = useState<File | null>(null);
  const [stadiumPreview, setStadiumPreview] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      setName(tournament.name || '');
      setVenueName(tournament.venue_name || '');
      setVenueAddress(tournament.venue_address || '');
      setRefereeName(tournament.referee_name || '');
      setStartDate(tournament.start_date ? tournament.start_date.slice(0, 10) : '');
      setLogoPreview(tournament.logo_url || null);
      setStadiumPreview(tournament.venue_photos?.[0] || null);
      setLogoFile(null);
      setStadiumFile(null);
    }
  }, [tournament]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setFile: any, setPreview: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = tournament.logo_url;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `logos/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('tournament-assets').upload(path, logoFile);
        if (!error) logoUrl = supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
      }
      let venuePhotos = tournament.venue_photos || [];
      if (stadiumFile) {
        const ext = stadiumFile.name.split('.').pop();
        const path = `stadiums/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('tournament-assets').upload(path, stadiumFile);
        if (!error) venuePhotos = [supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl];
      }

      const { error } = await supabase.from('tournaments').update({
        name, venue_name: venueName || null, venue_address: venueAddress || null,
        referee_name: refereeName || null,
        start_date: startDate || null,
        logo_url: logoUrl, venue_photos: venuePhotos,
      }).eq('id', tournament.id);
      if (error) throw error;
      toast({ title: 'تم حفظ التعديلات ✅' });
      onOpenChange(false);
      window.location.reload();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل البطولة</DialogTitle>
          <DialogDescription>تحديث معلومات البطولة الأساسية</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex flex-col items-center gap-2">
            <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : <Camera className="w-6 h-6 text-muted-foreground" />}
              <input type="file" accept="image/*" onChange={(e) => handleFile(e, setLogoFile, setLogoPreview)} className="sr-only" />
            </label>
            <span className="text-xs text-muted-foreground">شعار البطولة</span>
          </div>

          <div>
            <Label>اسم البطولة</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>تاريخ البداية</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <Label>اسم الملعب</Label>
            <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="مثال: ملعب البلدية" />
          </div>

          <div>
            <Label>عنوان الملعب</Label>
            <Input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="المدينة، الحي" />
          </div>

          <div>
            <Label>اسم الحكم</Label>
            <Input value={refereeName} onChange={(e) => setRefereeName(e.target.value)} />
          </div>

          <label className="block w-full h-28 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
            {stadiumPreview ? (
              <img src={stadiumPreview} alt="stadium" className="w-full h-full object-cover" />
            ) : <><ImageIcon className="w-6 h-6 text-muted-foreground" /><span className="text-xs text-muted-foreground mt-1">صورة الملعب</span></>}
            <input type="file" accept="image/*" onChange={(e) => handleFile(e, setStadiumFile, setStadiumPreview)} className="sr-only" />
          </label>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Save className="w-4 h-4 ms-2" />}
              حفظ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
