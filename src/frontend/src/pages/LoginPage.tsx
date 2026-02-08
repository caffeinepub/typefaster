import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPublicLeaderboard } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard, Trophy, Zap, Medal, Award } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const { data: publicLeaderboard, isLoading: leaderboardLoading } = useGetPublicLeaderboard();

  const isLoggingIn = loginStatus === 'logging-in';

  const sortedLeaderboard = publicLeaderboard
    ? [...publicLeaderboard].sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 10)
    : [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <Award className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <img
            src="/assets/generated/generated/hands-typing-gaming-keyboard-dark.dim_800x400.png"
            alt="Hands typing on a gaming keyboard with RGB lighting"
            className="w-full max-w-2xl mx-auto rounded-lg shadow-2xl"
          />
          <h1 className="text-5xl font-bold text-primary">
            TypeFaster
          </h1>
          <p className="text-xl text-muted-foreground">Type faster, win ICP</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <Keyboard className="w-8 h-8 text-chart-1 mb-2" />
              <CardTitle className="text-lg">5 Levels</CardTitle>
              <CardDescription>
                Progress through increasingly challenging typing tests
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-chart-2 mb-2" />
              <CardTitle className="text-lg">Earn XP</CardTitle>
              <CardDescription>
                Gain points for accuracy and speed bonuses
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Trophy className="w-8 h-8 text-chart-4 mb-2" />
              <CardTitle className="text-lg">Win ICP</CardTitle>
              <CardDescription>
                Compete daily for cryptocurrency rewards
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="md:row-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-chart-1" />
                Top Players
              </CardTitle>
              <CardDescription>
                See who's leading the competition
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {leaderboardLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              ) : sortedLeaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No players yet—be the first to compete!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedLeaderboard.map(([username, xp], index) => (
                    <div
                      key={`${username}-${index}`}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index < 3 ? 'bg-muted/50' : 'bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[60px]">
                          {getRankIcon(index + 1)}
                          <span className="font-bold text-sm">#{index + 1}</span>
                        </div>
                        <span className="font-medium">{username}</span>
                      </div>
                      <span className="font-bold text-primary">
                        {Number(xp).toLocaleString()} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:row-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Login with Internet Identity to start your typing journey
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full"
                size="lg"
              >
                {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
