import { cn } from '@/lib/utils';

type HabitlyLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  className?: string;
  priority?: boolean;
  theme?: 'default' | 'light';
};

const shellSizes = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function HabitlyLogo({
  size = 'md',
  alt = 'Habitly',
  className,
  priority = false,
  theme = 'default',
}: HabitlyLogoProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        shellSizes[size],
        theme === 'light'
          ? 'bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
          : 'bg-[#213d48] shadow-[inset_0_1px_0_rgba(145,201,187,0.14)]',
        className,
      )}
    >
      <img
        src="/habitlyLogo.png"
        alt={alt}
        className="h-full w-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </span>
  );
}