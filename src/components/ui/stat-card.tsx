import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "sports-card relative overflow-hidden p-6 transition-all duration-500 group",
      className
    )}>
      {/* Dynamic Background Decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:shadow-glow transition-all duration-500">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md",
              trend.isPositive 
                ? "bg-emerald-400/10 text-emerald-400" 
                : "bg-red-400/10 text-red-400"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {label}
           </span>
           <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors duration-300">
                {value}
              </span>
              {trend && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase">هذا الشهر</span>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
