import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { StreakFreezeCounter } from './StreakFreeze';
import HabitFormModal from './HabitFormModal';
import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen = false, onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showHabitModal, setShowHabitModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Sidebar Toggle + Logo - Left */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/Logo.png" alt="Habitly Logo" className="h-10 w-10 object-contain rounded-full" />
            <span className="font-display text-xl font-bold text-foreground hidden sm:inline">
              Habitly
            </span>
          </Link>
        </div>

        {/* Right side: StreakCounter, Theme, Profile */}
        <div className="flex items-center gap-4">
          {user && <StreakFreezeCounter />}
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="max-w-[100px] truncate text-sm hidden sm:inline">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Quick Add Habit Modal */}
      <HabitFormModal open={showHabitModal} onClose={() => setShowHabitModal(false)} onSubmit={() => setShowHabitModal(false)} />
    </header>
  );
};
