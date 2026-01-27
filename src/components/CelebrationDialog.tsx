import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles, Trophy, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface CelebrationDialogProps {
  open: boolean;
  onClose: () => void;
  habitTitle: string;
  streak?: number;
}

export const CelebrationDialog: React.FC<CelebrationDialogProps> = ({
  open,
  onClose,
  habitTitle,
  streak = 0,
}) => {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    if (open) {
      // Generate confetti
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setConfetti(items);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden border-2 border-primary/20">
        {/* Confetti Animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((item) => (
            <div
              key={item.id}
              className="absolute -top-4 h-3 w-3 animate-confetti rounded-full"
              style={{
                left: `${item.left}%`,
                animationDelay: `${item.delay}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative space-y-6 py-6 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-bounce">
            <Trophy className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold text-foreground">
              🎉 Awesome!
            </h2>
            <p className="text-lg text-muted-foreground">
              You completed{' '}
              <span className="font-semibold text-primary">{habitTitle}</span>{' '}
              today!
            </p>
          </div>

          {/* Streak Info */}
          {streak > 0 && (
            <div className="mx-auto flex w-fit items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 px-4 py-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-foreground">
                {streak} Day Streak!
              </span>
            </div>
          )}

          {/* Motivational Message */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>Keep up the great work!</span>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} size="lg" className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
