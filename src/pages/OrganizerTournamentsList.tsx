import { BrandLogo } from '@/components/BrandLogo';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Search, Users, Edit, Filter, Gavel, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EditTournamentDialog } from '@/components/tournament/EditTournamentDialog';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'نشطة', bg: 'bg-primary/10', text: 'text-primary' },
  live: { label: 'جارية', bg: 'bg-primary/10', text: 'text-primary' },
  upcoming: { label: 'مخططة', bg: 'bg-blue-100', text: 'text-blue-700' },
  draft: { label: 'مسودة', bg: 'bg-muted', text: 'text-muted-foreground' },
  completed: { label: 'مكتملة', bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function OrganizerTournamentsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournaments, loading } = useTournaments();
  const [editTournament, setEditTournament] = useState<any>(null);
  const [search, setSearch] = useState('');

  const myTournaments = tournaments
    .filter(t => t.owner_id === user?.id)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" dir="rtl">
      <header className="h-16 px-4 lg:px-8 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30">
        <BrandLogo size="sm" />
        <h1 className="font-display text-xl font-bold text-foreground tracking-wide">إدارة البطولات</h1>
        <div className="w-10" />
      </header>

      <div className="p-4 pb-28 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن بطولة..."
            className="w-full h-11 pr-10 pl-3 rounded-lg bg-muted border border-border text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {['الكل', 'نشطة', 'مكتملة', 'مسودة'].map((f, i) => (
            <button key={i} className="shrink-0 h-10 px-3 rounded-lg bg-muted border border-border text-xs text-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {f}
            </button>
          ))}
        </div>

        {loading && [1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}

        {!loading && myTournaments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">لا توجد بطولات</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء بطولتك الأولى</p>
          </div>
        )}

        {!loading && myTournaments.map(t => {
          const st = STATUS_LABEL[t.status] || STATUS_LABEL.draft;
          return (
            <div
              key={t.id}
              onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${t.id}`)}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="relative h-44">
                <img src={t.venue_photos?.[0] || '/images/sport-stadium.jpg'} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <button
                  onClick={(e) => { e.stopPropagation(); setEditTournament(t); }}
                  className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow"
                  aria-label="تعديل البطولة"
                >
                  <Edit className="w-4 h-4 text-foreground" />
                </button>
                <div className="absolute bottom-3 right-3 left-3 flex items-end gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-card ring-4 ring-primary shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                    {t.logo_url
                      ? <img src={t.logo_url} className="w-full h-full object-cover" alt={t.name} />
                      : <Trophy className="w-7 h-7 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0 text-white">
                    <h3 className="font-display text-lg font-bold drop-shadow truncate">{t.name}</h3>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                      ● {st.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <InfoCell icon={Gavel} label="الحكم" value={t.referee_name || '—'} />
                  <InfoCell icon={MapPin} label="الملعب" value={t.venue_name || '—'} />
                  <InfoCell icon={Users} label="الفرق" value={String(t.num_teams)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate(`${ORGANIZER_BASE}/tournaments/new`)}
        className="fixed bottom-20 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>بطولة جديدة</span>
      </button>

      {editTournament && (
        <EditTournamentDialog
          tournament={editTournament}
          open={!!editTournament}
          onOpenChange={(o) => !o && setEditTournament(null)}
        />
      )}
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="w-4 h-4 mb-1" />
      <span className="font-bold text-foreground truncate max-w-full" title={value}>{value}</span>
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

