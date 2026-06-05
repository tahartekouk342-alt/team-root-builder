import { ReactNode } from 'react';
import { MobileShell } from '@/components/layout/MobileShell';

interface OrganizerLayoutProps {
  children: ReactNode;
}

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  return <MobileShell variant="organizer">{children}</MobileShell>;
}
