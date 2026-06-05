import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setLanguage } from '@/i18n';

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current = i18n.language === 'fr' ? 'FR' : 'AR';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="gap-2">
          <Languages className="w-4 h-4" />
          {!compact && <span className="text-xs font-semibold">{current}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('ar')}>
          🇸🇦 العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('fr')}>
          🇫🇷 Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
