import { useGetLeaderboard } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Home } from 'lucide-react';

interface LeaderboardPageProps {
  onReturn: () => void;
}

export default function LeaderboardPage({ onReturn }: LeaderboardPageProps) {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  const sortedLeaderboard = leaderboard
    ? [...leaderboard].sort((a, b) => Number(b[1]) - Number(a[1]))
    : [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Award className="w-5 h-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-chart-1" />
          Global Leaderboard
        </h2>
        <p className="text-muted-foreground">Top typing champions ranked by highest individual session score</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>All players ranked by their best single-session XP</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedLeaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No players yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to complete a challenge!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLeaderboard.map(([username, xp], index) => (
                <div
                  key={`${username}-${index}`}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    index < 3
                      ? 'bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50'
                      : 'bg-muted/20 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      {getRankIcon(index + 1)}
                      <span className="font-bold text-lg">#{index + 1}</span>
                    </div>
                    <span className="font-medium text-lg">{username}</span>
                  </div>
                  <span className="font-bold text-xl text-primary">
                    {Number(xp).toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center pb-6">
        <Button onClick={onReturn} variant="outline" size="lg" className="gap-2">
          <Home className="w-4 h-4" />
          Return to Menu
        </Button>
      </div>
    </div>
  );
}
