// SmartGain Frontend - App Layout Component
// Main layout with header, sidebar, and content area

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, TrendingUp, Utensils, Dumbbell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Progress', href: '/app/progress', icon: TrendingUp },
    { name: 'Log Meal', href: '/app/nutrition/log', icon: Utensils },
    { name: 'Meal Plan', href: '/app/nutrition/plan', icon: Utensils },
    { name: 'Log Workout', href: '/app/workout/log', icon: Dumbbell },
    { name: 'Workout Plan', href: '/app/workout/plan', icon: Dumbbell },
    { name: 'Profile', href: '/app/profile', icon: User },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="border-b p-4">
                    <h2 className="text-lg font-semibold">SmartGain</h2>
                  </div>
                  <nav className="flex-1 space-y-1 p-4">
                    <NavLinks />
                  </nav>
                  <div className="border-t p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/app/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold">SmartGain</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline-block">
              {user?.name}
            </span>
            <Button variant="outline" size="sm" onClick={logout} className="hidden md:inline-flex">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1 p-4">
            <NavLinks />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
