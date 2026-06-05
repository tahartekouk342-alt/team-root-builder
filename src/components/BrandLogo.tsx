interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'auto' | 'onLight' | 'onDark';
  /** When true, render the text BEFORE the icon (default true to match brand request). */
  textFirst?: boolean;
}

const sizes = {
  sm: { icon: 'w-10 h-10', text: 'text-xl' },
  md: { icon: 'w-14 h-14', text: 'text-2xl' },
  lg: { icon: 'w-20 h-20', text: 'text-3xl' },
  xl: { icon: 'w-28 h-28', text: 'text-4xl' },
};

/**
 * Bottolat brand mark — logo icon + wordmark.
 * Wordmark mimics the icon style: italic bold, "Botto" + gold "lat".
 */
export function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  variant = 'auto',
  textFirst = true,
}: BrandLogoProps) {
  const s = sizes[size];
  const textColor =
    variant === 'onDark' ? 'text-white' :
    variant === 'onLight' ? 'text-[hsl(var(--brand-navy))]' :
    'text-foreground';

  const wordmark = showText && (
    <div className="leading-none">
      <div className={`font-display font-extrabold italic tracking-wider ${s.text} ${textColor}`}>
        <span>Botto</span>
        <span className="text-[hsl(var(--brand-gold))]">lat</span>
      </div>
    </div>
  );

  const icon = (
    <div className={`${s.icon} shrink-0 flex items-center justify-center drop-shadow-md`}>
      <img src="/icon-512.png" alt="Bottolat" className="w-full h-full object-contain" />
    </div>
  );

  return (
    <div className={`flex items-center gap-2.5 ${className}`} dir="ltr">
      {textFirst ? (<>{wordmark}{icon}</>) : (<>{icon}{wordmark}</>)}
    </div>
  );
}
