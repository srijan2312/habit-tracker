import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Leaf, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { QuickAddHabitButton } from './QuickAddHabitButton';
import { SearchBar } from './SearchBar';
import { MotivationalQuote } from './MotivationalQuote';
import { StreakFreezeCounter } from './StreakFreeze';
import HabitFormModal from './HabitFormModal';
import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { NavLink } from './NavLink';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);

  const navLinkClasses = 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-3 py-1 rounded-full';
  const activeNavLinkClasses = 'text-foreground bg-primary/10 shadow-sm';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // For demo: just alert search
  const handleSearch = (query: string) => {
    if (query) alert(`Search for: ${query}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Habitly
          </span>
        </Link>

        {/* Centered Menu */}
        {user && (
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-10">
            <NavLink 
              to="/dashboard" 
              className={navLinkClasses}
              activeClassName={activeNavLinkClasses}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/monthly-tracker" 
              className={navLinkClasses}
              activeClassName={activeNavLinkClasses}
            >
              Monthly Tracker
            </NavLink>
            <NavLink 
              to="/calendar" 
              className={navLinkClasses}
              activeClassName={activeNavLinkClasses}
            >
              Calendar
            </NavLink>
            <NavLink 
              to="/leaderboard" 
              className={navLinkClasses}
              activeClassName={activeNavLinkClasses}
            >
              Leaderboard
            </NavLink>
          </nav>
        )}

        {/* Right side: ThemeToggle, Profile */}
        <div className="flex items-center gap-4">
          {user && (
            <StreakFreezeCounter />
          )}
          {/* Always show ThemeToggle in top bar */}
          <ThemeToggle />
          {user ? (
            <>
              {/* Desktop User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:flex">
                  <Button variant="ghost" className="gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="max-w-[150px] truncate text-sm">
                      {user.name || (user as any).fullName || user.email.split('@')[0]}
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
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="absolute left-0 top-16 w-full border-b bg-card p-4 md:hidden z-50">
                  <nav className="flex flex-col gap-4">
                    <NavLink 
                      to="/dashboard" 
                      className="text-sm font-medium px-2 py-1 rounded"
                      activeClassName="text-foreground bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink 
                      to="/monthly-tracker" 
                      className="text-sm font-medium px-2 py-1 rounded"
                      activeClassName="text-foreground bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Monthly Tracker
                    </NavLink>
                    <NavLink 
                      to="/calendar" 
                      className="text-sm font-medium px-2 py-1 rounded"
                      activeClassName="text-foreground bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Calendar
                    </NavLink>
                    <NavLink 
                      to="/leaderboard" 
                      className="text-sm font-medium px-2 py-1 rounded"
                      activeClassName="text-foreground bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Leaderboard
                    </NavLink>
                    <hr className="border-border" />
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm font-medium text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
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
