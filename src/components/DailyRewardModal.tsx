import { useDailyReward } from '@/hooks/useDailyReward';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Zap, Trophy } from 'lucide-react';

interface DailyRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyRewardModal({ open, onOpenChange }: DailyRewardModalProps) {
  const { data: reward, isClaimingReward, claimReward } = useDailyReward();

  if (!reward) return null;

  const handleClaim = () => {
    claimReward();
    // Close modal after claiming
    setTimeout(() => onOpenChange(false), 500);
  };

  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const isFinalDay = reward.currentDay === 7;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Gift className="w-6 h-6 text-yellow-500" />
            Daily Signin Reward
          </DialogTitle>
          <DialogDescription>
            Complete 7 consecutive days to earn a Freeze Token!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 7-Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <div
                key={day}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  day < reward.currentDay
                    ? 'bg-green-500/20 border-green-500 shadow-lg'
                    : day === reward.currentDay
                    ? 'bg-primary/30 border-primary shadow-lg scale-105'
                    : 'bg-muted border-muted-foreground/20'
                }`}
              >
                <span className="text-xs font-bold mb-1">Day {day}</span>
                {day < reward.currentDay ? (
                  <div className="text-green-500">✓</div>
                ) : day === reward.currentDay ? (
                  <div className="text-primary text-lg">●</div>
                ) : (
                  <div className="text-muted-foreground/40">○</div>
                )}
              </div>
            ))}
          </div>

          {/* Reward Display */}
          <div className={`p-4 rounded-lg border-2 text-center transition-all ${
            isFinalDay
              ? 'bg-yellow-500/10 border-yellow-500 shadow-lg'
              : 'bg-blue-500/10 border-blue-500'
          }`}>
            {isFinalDay ? (
              <div className="space-y-2">
                <div className="flex justify-center mb-2">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
                <p className="text-sm font-medium">Day 7 Reward</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  1 Freeze Token
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Today's Reward</p>
                <p className="text-2xl font-bold">+10 Points</p>
                <p className="text-xs text-muted-foreground">
                  {7 - reward.currentDay} day{7 - reward.currentDay !== 1 ? 's' : ''} until Freeze Token
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Total Points</p>
              <p className="text-xl font-bold">{reward.totalPoints}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Freeze Tokens</p>
              <p className="text-xl font-bold flex items-center justify-center gap-1">
                <Zap className="w-4 h-4" />
                {reward.freezeTokens}
              </p>
            </div>
          </div>

          {/* Claim Button */}
          <Button
            onClick={handleClaim}
            disabled={!reward.canClaimToday || isClaimingReward}
            className="w-full h-11 text-base"
            size="lg"
          >
            {!reward.canClaimToday ? (
              'Already Claimed Today'
            ) : isClaimingReward ? (
              'Claiming...'
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim Reward
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
