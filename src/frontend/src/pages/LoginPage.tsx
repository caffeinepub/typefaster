import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetLeaderboard, useRecordVisitor } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Target, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getAnonymizedVisitorId } from '../utils/visitorId';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard();
  const recordVisitor = useRecordVisitor();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoggingIn = loginStatus === 'logging-in';

  // Record visitor on landing page load
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const visitorId = await getAnonymizedVisitorId();
        await recordVisitor.mutateAsync(visitorId);
      } catch (error) {
        console.error('Failed to record visitor:', error);
      }
    };
    
    trackVisitor();
  }, []);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const topThree = leaderboard?.slice(0, 3) || [];
  const remaining = leaderboard?.slice(3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/assets/generated/typing-hero.dim_800x400.png"
                alt="Typing Challenge Hero"
                className="w-full h-auto"
              />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              TypeFaster
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Challenge yourself with progressive typing levels. Earn XP, compete on the leaderboard, and win ICP
              prizes!
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Small Feature Cards */}
            <div className="space-y-6">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <img src="/assets/generated/trophy-icon.dim_64x64.png" alt="Trophy" className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle>Compete & Win</CardTitle>
                      <CardDescription>Climb the leaderboard</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Earn XP by typing accurately and quickly. Top performers win ICP prizes in active competitions.
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <img src="/assets/generated/timer-icon.dim_64x64.png" alt="Timer" className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle>Progressive Levels</CardTitle>
                      <CardDescription>5 challenging stages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Start easy and progress through increasingly difficult typing challenges. Beat the clock for bonus
                    XP!
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Players Card - matches combined height */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Top Players</CardTitle>
                      <CardDescription>Global leaderboard</CardDescription>
                    </div>
                  </div>
                  {remaining.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Expand
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {leaderboardLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
                ) : topThree.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No players yet. Be the first to compete!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topThree.map(([username, xp], index) => (
                      <div
                        key={username}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                          <div>
                            <p className="font-semibold">{username}</p>
                            <p className="text-sm text-muted-foreground">Rank #{index + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{Number(xp)} XP</p>
                        </div>
                      </div>
                    ))}
                    
                    {isExpanded && remaining.map(([username, xp], index) => (
                      <div
                        key={username}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg text-muted-foreground">#{index + 4}</span>
                          <div>
                            <p className="font-semibold">{username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{Number(xp)} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Get Started Card - matches combined height */}
            <Card className="flex flex-col md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Get Started</CardTitle>
                    <CardDescription>Login with Internet Identity to begin</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center items-center space-y-4">
                <p className="text-center text-muted-foreground max-w-md">
                  Secure, anonymous authentication powered by the Internet Computer. No passwords, no personal data
                  required.
                </p>
                <Button onClick={handleLogin} disabled={isLoggingIn} size="lg" className="gap-2">
                  <Target className="h-5 w-5" />
                  {isLoggingIn ? 'Logging in...' : 'Login to Start'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
