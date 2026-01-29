import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Dashboard, BookOpen, Search, BarChart3, HelpCircle, Clock, Settings, Trophy, Users, Calendar, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    { icon: Dashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Activity, label: 'Monthly Tracker', href: '/monthly-tracker' },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: Trophy, label: 'Challenges', href: '/leaderboard' },
    { icon: Users, label: 'Invite Friends', href: '/invite' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: BookOpen, label: 'Journal', href: '/journal' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: HelpCircle, label: 'Help', href: '/help' },
    { icon: Clock, label: 'History', href: '/history' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card border"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-card border-r border-border shadow-lg transition-transform duration-300 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Habitly</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {user.email?.split('@')[0]}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-border">
          <button
            onClick={async () => {
              await signOut();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
