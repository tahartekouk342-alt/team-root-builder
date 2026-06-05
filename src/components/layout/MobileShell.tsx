import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomTabBar } from './BottomTabBar';
import { DesktopSidebar } from './DesktopSidebar';

interface MobileShellProps {
  children: ReactNode;
  variant?: 'organizer';
  hideTabBar?: boolean;
}

/**
 * Responsive shell: mobile/tablet → bottom tab bar; desktop (lg+) → left sidebar layout.
 */
export function MobileShell({ children, hideTabBar }: MobileShellProps) {
  const { i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  return (
    <div className="min-h-screen bg-background brand-stripes flex" dir={dir}>
      {!hideTabBar && <DesktopSidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <main className={`flex-1 ${hideTabBar ? '' : 'pb-20 lg:pb-0'}`}>
          {children}
        </main>
        {!hideTabBar && <div className="lg:hidden"><BottomTabBar /></div>}
      </div>
    </div>
  );
}
