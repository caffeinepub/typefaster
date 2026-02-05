import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trophy, BarChart3, Wallet, Home, Shield } from 'lucide-react';
import type { Page } from '../App';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  // Check admin status from both the query and the user profile
  const isUserAdmin = isAdmin || userProfile?.isAdmin || false;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                TypeFaster
              </h1>
              <p className="text-xs text-muted-foreground">Type faster, win ICP</p>
            </div>

            {isAuthenticated && userProfile && (
              <nav className="hidden md:flex items-center gap-2">
                <Button
                  variant={currentPage === 'menu' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('menu')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Menu
                </Button>
                <Button
                  variant={currentPage === 'leaderboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('leaderboard')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
                <Button
                  variant={currentPage === 'stats' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('stats')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </Button>
                <Button
                  variant={currentPage === 'wallet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('wallet')}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet
                </Button>
                {isUserAdmin && (
                  <Button
                    variant={currentPage === 'admin' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onNavigate('admin')}
                    className="relative"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && userProfile && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium flex items-center gap-1 justify-end">
                  {userProfile.username}
                  {isUserAdmin && (
                    <Shield className="w-3 h-3 text-primary" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Logged in</p>
              </div>
            )}
            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                disabled={disabled}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
