import { BrandLogo } from '@/components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, User as UserIcon, Calendar, Award, Loader2, TrendingUp, UserPlus, CalendarCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();


  const { data: stats } = useQuery({
    queryKey: ['org-stats', user?.id],
    queryFn: async () => {
      if (!user) return { active: 0, teams: 0, completed: 0, upcoming: 0 };
      const { data: tournaments } = await supabase
        .from('tournaments').select('id, status, num_teams').eq('owner_id', user.id);
      const list = tournaments || [];
      const ids = list.map(t => t.id);
      const teamsTotal = list.reduce((s, t) => s + (t.num_teams || 0), 0);
      let upcomingMatches = 0;
      if (ids.length) {
        const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true })
          .in('tournament_id', ids).eq('status', 'scheduled');
        upcomingMatches = count || 0;
      }
      return {
        active: list.filter(t => ['active', 'live', 'upcoming'].includes(t.status as string)).length,
        teams: teamsTotal,
        completed: list.filter(t => t.status === 'completed').length,
        upcoming: upcomingMatches,
      };
    },
    enabled: !!user?.id,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['org-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: ts } = await supabase.from('tournaments')
        .select('id, name, created_at, status, updated_at').eq('owner_id', user.id);
      const list = ts || [];
      const ids = list.map(t => t.id);
      const tMap = Object.fromEntries(list.map(t => [t.id, t.name]));

      const items: Array<{ kind: string; title: string; subtitle: string; date: string }> = [];

      list.slice(0, 5).forEach(t => {
        items.push({
          kind: 'tournament',
          title: 'تم إنشاء بطولة جديدة',
          subtitle: t.name,
          date: t.created_at,
        });
      });

      if (ids.length) {
        const { data: teams } = await supabase.from('teams')
          .select('name, tournament_id, created_at').in('tournament_id', ids)
          .order('created_at', { ascending: false }).limit(5);
        (teams || []).forEach(tm => {
          items.push({
            kind: 'team',
            title: 'تم تسجيل فريق جديد',
            subtitle: `${tm.name} · ${tMap[tm.tournament_id] || ''}`,
            date: tm.created_at,
          });
        });

        const { data: completedMatches } = await supabase.from('matches')
          .select('home_score, away_score, updated_at, tournament_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
          .in('tournament_id', ids).eq('status', 'completed')
          .order('updated_at', { ascending: false }).limit(5);
        (completedMatches || []).forEach((m: any) => {
          items.push({
            kind: 'result',
            title: 'تم تحديث نتائج مباراة',
            subtitle: `${m.home_team?.name || '?'} ${m.home_score} - ${m.away_score} ${m.away_team?.name || '?'}`,
            date: m.updated_at,
          });
        });
      }

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    },
    enabled: !!user?.id,
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }


  return (
    <div className="min-h-screen" dir="rtl">
      <header className="h-16 px-4 lg:px-8 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <BrandLogo size="sm" />
        <button
          onClick={() => navigate(`${ORGANIZER_BASE}/settings`)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-primary/20"
          aria-label="الملف الشخصي والإعدادات"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </header>

      <div className="p-4 pb-24 space-y-5">
        {/* Welcome card */}
        <div className="relative h-[200px] rounded-xl overflow-hidden">
          <img src="/images/sport-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative p-4 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">مرحباً {profile?.display_name || 'بك'}!</h2>
                <p className="text-white/90 text-sm mt-1">إدارة بطولاتك بسهولة واحترافية</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-black/30 rounded-lg p-3">
              <Stat label="البطولات النشطة" value={stats?.active || 0} icon={Trophy} />
              <Stat label="الفرق" value={stats?.teams || 0} icon={Users} />
              <Stat label="مكتملة" value={stats?.completed || 0} icon={Award} />
            </div>
          </div>
        </div>

        {/* KPI grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <Kpi icon={Trophy} value={stats?.active || 0} label="البطولات النشطة" />
          <Kpi icon={Calendar} value={stats?.upcoming || 0} label="المباريات القادمة" />
          <Kpi icon={Users} value={stats?.teams || 0} label="إجمالي الفرق" />
          <Kpi icon={Award} value={stats?.completed || 0} label="الفعاليات المكتملة" />
        </div>

        {/* Activity Feed */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center justify-end gap-2">
            <span>النشاط الأخير</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {activity.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">لا يوجد نشاط بعد</div>
            )}
            {activity.map((a, i) => {
              const Icon = a.kind === 'tournament' ? Trophy : a.kind === 'team' ? UserPlus : a.kind === 'result' ? BarChart3 : CalendarCheck;
              return <ActivityRow key={i} icon={Icon} title={a.title} subtitle={a.subtitle} time={timeAgo(a.date)} last={i === activity.length - 1} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="text-center text-white">
      <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-[10px] opacity-90 mt-1">{label}</p>
    </div>
  );
}

function Kpi({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 h-[120px] flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <div className="w-8 h-0.5 bg-primary mt-2 rounded" />
    </div>
  );
}

function ActivityRow({ icon: Icon, title, subtitle, time, last }: any) {
  return (
    <div className={`flex items-center gap-3 p-3 ${last ? '' : 'border-b border-border'}`}>
      <span className="text-xs text-muted-foreground shrink-0 w-16">{time}</span>
      <div className="flex-1 text-right">
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}
