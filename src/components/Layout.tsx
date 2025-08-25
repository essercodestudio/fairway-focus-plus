import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Home, Trophy, Users, Target, Award } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Trophy, label: 'Torneios', path: '/tournaments' },
    { icon: Users, label: 'Grupos', path: '/groups' },
    { icon: Target, label: 'Treino', path: '/training' },
    { icon: Award, label: 'Conquistas', path: '/achievements' },
  ];

  const MenuItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <Button
      variant={location.pathname === path ? "default" : "ghost"}
      className="w-full justify-start gap-3 h-12 text-base"
      onClick={() => navigate(path)}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col h-full">
                <div className="py-6">
                  <h2 className="text-lg font-bold text-primary">18BIRDIES</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                
                <nav className="flex-1 space-y-2">
                  {menuItems.map((item) => (
                    <MenuItem key={item.path} {...item} />
                  ))}
                </nav>
                
                <div className="mt-auto pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-bold text-primary">18BIRDIES</h1>
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary">18BIRDIES</h2>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <MenuItem key={item.path} {...item} />
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen md:min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;