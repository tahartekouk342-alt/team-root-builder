import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, CalendarDays, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORGANIZER_BASE } from '@/lib/constants';

interface TabItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  match: (pathname: string) => boolean;
}

interface BottomTabBarProps {
  variant?: 'organizer';
}

export function BottomTabBar({}: BottomTabBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs: TabItem[] = [
    { label: 'الرئيسية', icon: LayoutDashboard, path: `${ORGANIZER_BASE}/dashboard`, match: (p) => p === `${ORGANIZER_BASE}/dashboard` || p === ORGANIZER_BASE || p === '/' },
    { label: 'البطولات', icon: Trophy, path: `${ORGANIZER_BASE}/tournaments`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/tournaments`) || p.includes(`${ORGANIZER_BASE}/tournament/`) },
    { label: 'المباريات', icon: CalendarDays, path: `${ORGANIZER_BASE}/matches`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/matches`) },
    { label: 'الفرق', icon: Users, path: `${ORGANIZER_BASE}/teams`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/teams`) },
    { label: 'الإحصائيات', icon: BarChart3, path: `${ORGANIZER_BASE}/stats`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/stats`) },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border lg:hidden shadow-[0_-4px_16px_-4px_hsl(var(--brand-navy)/0.12)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="bottom navigation"
    >
      {/* Brand strip — text BEFORE icon */}
      <div className="flex items-center justify-center gap-2 py-1 border-b border-border/60 bg-gradient-to-r from-[hsl(var(--brand-navy))]/5 via-transparent to-[hsl(var(--brand-gold))]/5" dir="ltr">
        <span className="font-display text-sm font-extrabold italic tracking-wider text-foreground">
          <span>Botto</span><span className="text-[hsl(var(--brand-gold))]">lat</span>
        </span>
        <img src="/icon-512.png" alt="Bottolat" className="w-6 h-6" />
      </div>

      <div className="grid grid-cols-5 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {active && <span className="absolute top-0 left-2 right-2 h-[3px] rounded-full bg-primary" />}
              <Icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.8} />
              <span className={cn('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
