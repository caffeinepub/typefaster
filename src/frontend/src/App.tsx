import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useActor } from './hooks/useActor';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import LoginPage from './pages/LoginPage';
import MainMenu from './pages/MainMenu';
import TypingChallenge from './pages/TypingChallenge';
import StatsPage from './pages/StatsPage';
import WalletPage from './pages/WalletPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type Page = 'menu' | 'challenge' | 'stats' | 'wallet' | 'leaderboard' | 'admin';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched,
    isError: profileError,
    error: profileErrorDetails,
    refetch: refetchProfile
  } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = useState<Page>('menu');

  const isAuthenticated = !!identity;

  // Show initialization loading
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show actor connection loading
  if (actorFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  // Check if actor is available
  if (!actor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Connection Failed</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Unable to connect to the backend canister. Please check your connection and try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle profile loading error
  if (profileError && profileFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Loading Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              {profileErrorDetails instanceof Error 
                ? profileErrorDetails.message 
                : 'Failed to load your profile. This might be a temporary issue.'}
            </p>
            <Button 
              onClick={() => refetchProfile()} 
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading Profile
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show profile setup modal if profile is null (new user)
  const showProfileSetup = isAuthenticated && profileFetched && userProfile === null && !profileError;

  if (showProfileSetup) {
    return <ProfileSetupModal />;
  }

  // Show loading while fetching profile
  if (profileLoading || !profileFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If we reach here without a profile, something went wrong
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Your profile could not be loaded. Please try refreshing the page.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'challenge':
        return <TypingChallenge onReturn={() => setCurrentPage('menu')} />;
      case 'stats':
        return <StatsPage onReturn={() => setCurrentPage('menu')} />;
      case 'wallet':
        return <WalletPage onReturn={() => setCurrentPage('menu')} />;
      case 'leaderboard':
        return <LeaderboardPage onReturn={() => setCurrentPage('menu')} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <MainMenu onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}
