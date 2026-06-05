import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Star, Crown } from 'lucide-react';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

interface VictoryConfettiProps {
  trigger?: boolean;
  onComplete?: () => void;
  teamName?: string;
  teamLogo?: string | null;
  sportType?: 'football' | 'basketball';
}

export function VictoryConfetti({ trigger = false, onComplete, teamName, teamLogo, sportType = 'football' }: VictoryConfettiProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setIsVisible(true);

    const pieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1.5,
      size: 4 + Math.random() * 8,
      color: ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#FFD700'][Math.floor(Math.random() * 6)],
    }));
    setConfetti(pieces);

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  const sportEmoji = sportType === 'basketball' ? '🏀' : '⚽';

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" />

      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              opacity: 0.9,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}

      {/* Main Winner Card */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="winner-card-enter relative w-[340px] max-w-[90vw]">
          {/* Glow ring */}
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-yellow-400/30 via-primary/30 to-yellow-400/30 blur-xl animate-pulse" />
          
          <div className="relative bg-gradient-to-b from-card via-card to-card/95 rounded-[1.5rem] border-2 border-yellow-400/50 shadow-2xl overflow-hidden">
            {/* Top gradient bar */}
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-primary to-yellow-400" />
            
            {/* Stars decoration */}
            <div className="absolute top-4 left-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
            </div>
            <div className="absolute top-4 right-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            <div className="p-6 text-center">
              {/* Crown */}
              <div className="flex justify-center mb-3">
                <Crown className="w-10 h-10 text-yellow-400 drop-shadow-lg crown-bounce" />
              </div>

              {/* Trophy / Logo */}
              <div className="relative mx-auto w-24 h-24 mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 to-primary/20 animate-pulse" />
                {teamLogo ? (
                  <img src={teamLogo} alt={teamName} className="w-full h-full rounded-full object-cover border-4 border-yellow-400/50 shadow-xl trophy-spin" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400/20 to-primary/20 flex items-center justify-center border-4 border-yellow-400/50 shadow-xl trophy-spin">
                    <Trophy className="w-12 h-12 text-yellow-500" />
                  </div>
                )}
              </div>

              {/* Sport emoji */}
              <div className="text-3xl mb-2">{sportEmoji}</div>

              {/* Title */}
              <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-1">🏆 البطل 🏆</h2>
              
              {/* Team Name */}
              {teamName && (
                <h1 className="text-2xl font-display font-black text-foreground mb-3 team-name-glow">{teamName}</h1>
              )}

              {/* Sparkles row */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>مبارك الفوز!</span>
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
            </div>

            {/* Bottom gradient */}
            <div className="h-1 bg-gradient-to-r from-yellow-400 via-primary to-yellow-400" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .winner-card-enter {
          animation: card-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes card-enter {
          0% { opacity: 0; transform: scale(0.3) translateY(40px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .crown-bounce {
          animation: crown-b 1s ease-in-out infinite;
        }
        @keyframes crown-b {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .trophy-spin {
          animation: t-spin 3s linear infinite;
        }
        @keyframes t-spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .team-name-glow {
          text-shadow: 0 0 20px hsl(var(--primary) / 0.3);
        }
      `}</style>
    </div>
  );
}
