import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Trophy, Camera, X, Plus, Image, MapPin, Swords, Users, Layers, Gavel, Clock } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type TournamentType = Database['public']['Enums']['tournament_type'];

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTournamentDialog({ open, onOpenChange }: CreateTournamentDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createTournament, createLeagueTournamentWithTeams, addTeams, performAIDraw, generateKnockoutMatches } = useTournaments();
  const { toast } = useToast();

  const tournamentTypes = [
    { value: 'knockout' as TournamentType, label: t('tournament.knockout'), icon: Swords, desc: t('tournament.knockoutDesc'), bg: 'from-red-500/20 to-orange-500/20', available: true },
    { value: 'league' as TournamentType, label: t('tournament.league'), icon: Trophy, desc: t('tournament.leagueDesc'), bg: 'from-blue-500/20 to-cyan-500/20', available: true },
    { value: 'groups' as TournamentType, label: t('tournament.groupsKnockout'), icon: Layers, desc: t('tournament.groupsKnockoutDesc'), bg: 'from-purple-500/20 to-pink-500/20', available: false },
  ];

  const sportTypes = [
    { value: 'football', label: t('tournament.football'), icon: '⚽' },
    { value: 'basketball', label: t('tournament.basketball'), icon: '🏀' },
    { value: 'volleyball', label: t('tournament.volleyball'), icon: '🏐' },
  ];

  const ageCategories = [
    { value: 'u13', label: t('tournament.ageCategory') + ' U13' },
    { value: 'u15', label: t('tournament.ageCategory') + ' U15' },
    { value: 'u17', label: t('tournament.ageCategory') + ' U17' },
    { value: 'u19', label: t('tournament.ageCategory') + ' U19' },
    { value: 'senior', label: t('tournament.ageCategory') + ' Senior' },
  ];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentType>('knockout');
  const [sportType, setSportType] = useState<'football' | 'basketball' | 'volleyball'>('football');
  const [volleyFormat, setVolleyFormat] = useState<'3of5' | '2of3'>('3of5');
  const [ageCategory, setAgeCategory] = useState<string>('senior');
  const [startDate, setStartDate] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [refereeName, setRefereeName] = useState('');
  const [leagueLegs, setLeagueLegs] = useState<1 | 2>(1);
  const [hasPlayoff, setHasPlayoff] = useState(false);
  const [playoffTeams, setPlayoffTeams] = useState<4 | 8>(4);
  const [stadiumImageFile, setStadiumImageFile] = useState<File | null>(null);
  const [stadiumImagePreview, setStadiumImagePreview] = useState<string | null>(null);
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [drawResult, setDrawResult] = useState<any>(null);

  const resetForm = () => {
    setStep(1); setName(''); setType('knockout'); setSportType('football');
    setVolleyFormat('3of5'); setAgeCategory('senior'); setStartDate('');
    setLogoFile(null); setLogoPreview(null);
    setVenueName(''); setVenueAddress(''); setRefereeName('');
    setLeagueLegs(1); setHasPlayoff(false); setPlayoffTeams(4);
    setStadiumImageFile(null); setStadiumImagePreview(null);
    setTeamsList([]); setNewTeamName(''); setDrawResult(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleStadiumImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStadiumImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setStadiumImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && !teamsList.includes(newTeamName.trim())) {
      setTeamsList(prev => [...prev, newTeamName.trim()]);
      setNewTeamName('');
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) {
        toast({ title: 'خطأ', description: 'يرجى إدخال اسم البطولة', variant: 'destructive' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (teamsList.length < 2) {
        toast({ title: 'خطأ', description: 'يرجى إدخال فريقين على الأقل', variant: 'destructive' });
        return;
      }
      setAiLoading(true);
      try {
        const result = await performAIDraw(teamsList, 'knockout');
        if (result) {
          setDrawResult(result);
          setStep(3);
        }
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `logos/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, logoFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      let venuePhotos: string[] = [];
      if (stadiumImageFile) {
        const fileExt = stadiumImageFile.name.split('.').pop();
        const filePath = `stadiums/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, stadiumImageFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
          venuePhotos = [publicUrl];
        }
      }

      const orderedTeams = drawResult?.draw || teamsList;

      if (type === 'league') {
        const tournament = await createLeagueTournamentWithTeams({
          name, startDate,
          teamNames: orderedTeams as string[],
          logoUrl, venueName, venueAddress, refereeName,
          venuePhotos, sportType,
          ageCategory,
          volleyballFormat: sportType === 'volleyball' ? volleyFormat : undefined,
          leagueLegs,
          hasPlayoff,
          playoffTeams: hasPlayoff ? playoffTeams : 4,
        });

        if (!tournament) return;
        toast({ title: 'تم بنجاح! 🎉', description: 'تم إنشاء الدوري وجدول المباريات والترتيب' });
        onOpenChange(false);
        resetForm();
        navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`);
        return;
      }

      const tournament = await createTournament({
        name, type, startDate,
        numTeams: teamsList.length,
        logoUrl, venueName, venueAddress, refereeName,
        acceptJoinRequests: false,
        venuePhotos, sportType,
        ageCategory,
        volleyballFormat: sportType === 'volleyball' ? volleyFormat : undefined,
        leagueLegs: 1,
        hasPlayoff: false,
        playoffTeams: 4,
      } as any);

      if (!tournament) return;

      const teams = await addTeams(tournament.id, orderedTeams as string[]);
      if (!teams) return;

      await generateKnockoutMatches(tournament.id, teams);

      toast({ title: 'تم بنجاح! 🎉', description: 'تم إنشاء البطولة وإجراء القرعة' });
      onOpenChange(false);
      resetForm();
      navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [t('tournament.stepInfo'), t('tournament.stepTeams'), t('tournament.stepDraw')];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-primary" />
            {t('tournament.createNew')}
          </DialogTitle>
          <DialogDescription>{stepLabels[step - 1]}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0',
                s === step ? 'bg-primary text-primary-foreground scale-110' : s < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>{s}</div>
              {s < 3 && <div className={cn('h-1 flex-1 rounded-full', s < step ? 'bg-primary/40' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <><Camera className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">{t('tournament.logo')}</span></>
                )}
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="sr-only" />
              </label>
            </div>

            <div className="space-y-2">
              <Label>{t('tournament.name')}</Label>
              <Input placeholder={t('tournament.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* Sport Type */}
            <div className="space-y-2">
              <Label>{t('tournament.sportLabel')}</Label>
              <div className="grid grid-cols-3 gap-3">
                {sportTypes.map((s) => (
                  <Card key={s.value} className={cn('cursor-pointer transition-all hover:scale-[1.02]',
                    sportType === s.value ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50')}
                    onClick={() => setSportType(s.value as any)}>
                    <CardContent className="p-3 flex flex-col items-center gap-1.5">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-bold text-xs text-center">{s.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Volleyball format selector */}
            {sportType === 'volleyball' && (
              <div className="space-y-2">
                <Label>{t('tournament.volleyballFormat')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: '3of5', l: t('tournament.volley3of5') },
                    { v: '2of3', l: t('tournament.volley2of3') },
                  ].map((opt) => (
                    <Card key={opt.v} className={cn('cursor-pointer transition-all',
                      volleyFormat === opt.v ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50')}
                      onClick={() => setVolleyFormat(opt.v as any)}>
                      <CardContent className="p-3 text-center text-sm font-semibold">{opt.l}</CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Age Category */}
            <div className="space-y-2">
              <Label>{t('tournament.ageCategory')}</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ageCategories.map((c) => (
                  <Card key={c.value} className={cn('cursor-pointer transition-all',
                    ageCategory === c.value ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50')}
                    onClick={() => setAgeCategory(c.value)}>
                    <CardContent className="p-2 text-center text-[11px] font-bold uppercase">{c.value}</CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tournament Type */}
            <div className="space-y-2">
              <Label>{t('tournament.typeLabel')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tournamentTypes.map((tt) => (
                  <Card key={tt.value}
                    className={cn('transition-all relative',
                      tt.available ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed',
                      type === tt.value && tt.available ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                    )}
                    onClick={() => { if (tt.available) setType(tt.value); }}>
                    <CardContent className={cn('p-4 bg-gradient-to-br rounded-lg', tt.bg)}>
                      {!tt.available && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-white border-0 text-[10px] gap-1">
                          <Clock className="w-3 h-3" /> {t('common.comingSoon')}
                        </Badge>
                      )}
                      <tt.icon className={cn('w-8 h-8 mb-2', type === tt.value && tt.available ? 'text-primary' : 'text-muted-foreground')} />
                      <h4 className="font-bold text-sm">{tt.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{tt.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('tournament.startDate')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            {/* Stadium */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />{t('tournament.venueDetails')}
                </h3>
                <label className="w-full h-32 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                  {stadiumImagePreview ? (
                    <img src={stadiumImagePreview} alt="stadium" className="w-full h-full object-cover" />
                  ) : (
                    <><Image className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-xs text-muted-foreground">{t('tournament.venueImage')}</span></>
                  )}
                  <input type="file" accept="image/*" onChange={handleStadiumImageSelect} className="sr-only" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('tournament.venueName')}</Label>
                    <Input placeholder={t('tournament.venuePlaceholder')} value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('tournament.venueAddress')}</Label>
                    <Input placeholder={t('tournament.addressPlaceholder')} value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Gavel className="w-4 h-4 text-primary" /> {t('tournament.refereeOptional')}</Label>
              <Input placeholder={t('tournament.refereePlaceholder')} value={refereeName} onChange={(e) => setRefereeName(e.target.value)} />
            </div>

            {/* League Settings (only when type === 'league') */}
            {type === 'league' && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />{t('tournament.leagueSettings', 'إعدادات الدوري')}
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('tournament.leagueLegs', 'صيغة الجولات')}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { v: 1, l: t('tournament.legsSingle', 'ذهاب فقط'), d: t('tournament.legsSingleDesc', 'كل فريق ضد كل فريق مرة') },
                        { v: 2, l: t('tournament.legsDouble', 'ذهاب وإياب'), d: t('tournament.legsDoubleDesc', 'كل فريق ضد كل فريق مرتين') },
                      ].map((opt) => (
                        <Card key={opt.v}
                          className={cn('cursor-pointer transition-all',
                            leagueLegs === opt.v ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50')}
                          onClick={() => setLeagueLegs(opt.v as 1 | 2)}>
                          <CardContent className="p-3 text-center">
                            <p className="font-semibold text-sm">{opt.l}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{opt.d}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Swords className="w-4 h-4 text-primary" />
                        {t('tournament.hasPlayoff', 'مرحلة بلاي أوف')}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('tournament.hasPlayoffDesc', 'إقصاء مباشر لأفضل الفرق بعد انتهاء الدوري')}
                      </p>
                    </div>
                    <Switch checked={hasPlayoff} onCheckedChange={setHasPlayoff} />
                  </div>

                  {hasPlayoff && (
                    <div className="space-y-2">
                      <Label className="text-xs">{t('tournament.playoffSize', 'عدد فرق البلاي أوف')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[4, 8].map((n) => (
                          <Card key={n}
                            className={cn('cursor-pointer transition-all',
                              playoffTeams === n ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50')}
                            onClick={() => setPlayoffTeams(n as 4 | 8)}>
                            <CardContent className="p-2 text-center text-sm font-semibold">Top {n}</CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder={t('tournament.teamName')} value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                className="flex-1" />
              <Button onClick={handleAddTeam} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
            </div>
            {teamsList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {teamsList.map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border bg-card group hover:border-primary/50 transition-colors animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                      <span className="font-medium text-sm truncate">{team}</span>
                    </div>
                    <button onClick={() => setTeamsList(prev => prev.filter((_, i) => i !== index))} className="opacity-0 group-hover:opacity-100 text-destructive p-1 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {t('tournament.teamsCount')}: <span className="font-bold text-foreground">{teamsList.length}</span>
            </p>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && drawResult && (
          <div className="space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">{t('tournament.drawResult')}</span>
                </div>
                {drawResult.draw && (
                  <div className="space-y-2">
                    {(drawResult.draw as string[]).reduce((acc: JSX.Element[], team: string, index: number) => {
                      if (index % 2 === 0) {
                        const opponent = drawResult.draw[index + 1];
                        acc.push(
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/80 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <span className="font-medium">{team}</span>
                            <span className="text-xs font-bold text-muted-foreground px-2 py-1 rounded bg-muted">{t('common.vs')}</span>
                            <span className="font-medium">{opponent || 'BYE'}</span>
                          </div>
                        );
                      }
                      return acc;
                    }, [])}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>{t('common.back')}</Button>}
          <div className="flex-1" />
          {step < 3 ? (
            <Button onClick={handleNext} disabled={aiLoading}>
              {aiLoading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />{t('common.loading')}</>
                : step === 2 ? <><Sparkles className="w-4 h-4 ml-2" />{t('tournament.drawResult')}</>
                : t('common.next')}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />{t('common.loading')}</>
                : <><Trophy className="w-4 h-4 ml-2" />{t('tournament.createNew')}</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
