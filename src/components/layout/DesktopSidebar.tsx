import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, CalendarDays, Users, Settings, BarChart3 } from 'lucide-react';
import { ORGANIZER_BASE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const items = [
  { label: 'الرئيسية', icon: LayoutDashboard, to: `${ORGANIZER_BASE}/dashboard` },
  { label: 'البطولات', icon: Trophy, to: `${ORGANIZER_BASE}/tournaments` },
  { label: 'المباريات', icon: CalendarDays, to: `${ORGANIZER_BASE}/matches` },
  { label: 'الفرق', icon: Users, to: `${ORGANIZER_BASE}/teams` },
  { label: 'الإحصائيات', icon: BarChart3, to: `${ORGANIZER_BASE}/stats` },
  { label: 'الإعدادات', icon: Settings, to: `${ORGANIZER_BASE}/settings` },
];

export function DesktopSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-border bg-card h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5 border-b border-border brand-hero text-white">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-3" dir="ltr">
            <div className="font-display text-3xl font-extrabold italic tracking-wider">
              <span>Botto</span><span className="text-[hsl(var(--brand-gold))]">lat</span>
            </div>
            <div className="w-16 h-16 drop-shadow-xl">
              <img src="/icon-512.png" alt="Bottolat" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/75">Tournaments • Managed • Simplified</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map(it => {
          const active = pathname === it.to || pathname.startsWith(it.to + '/') ||
            (it.to.endsWith('/dashboard') && (pathname === '/' || pathname === ORGANIZER_BASE));
          const Icon = it.icon;
          return (
            <NavLink key={it.to} to={it.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-muted'
              )}>
              <Icon className="w-5 h-5" />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 text-[10px] text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Bottolat
      </div>
    </aside>
  );
}
