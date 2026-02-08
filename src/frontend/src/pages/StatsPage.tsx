import { useGetUserChallengeSessions } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Award, Calendar, TrendingUp, Home } from 'lucide-react';
import type { ChallengeSession } from '../backend';

interface StatsPageProps {
  onReturn: () => void;
}

export default function StatsPage({ onReturn }: StatsPageProps) {
  const { data: sessions, isLoading } = useGetUserChallengeSessions();

  const totalXP = sessions ? sessions.reduce((sum, session) => sum + Number(session.metrics.xpEarned), 0) : 0;
  const totalSessions = sessions ? sessions.length : 0;
  const avgXP = totalSessions > 0 ? Math.round(totalXP / totalSessions) : 0;

  const formatDate = (timestamp: bigint | number) => {
    // Convert nanoseconds to milliseconds for Date constructor
    const timestampMs = typeof timestamp === 'bigint' 
      ? Number(timestamp) / 1_000_000 
      : timestamp / 1_000_000;
    const date = new Date(timestampMs);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Statistics</h1>
          <p className="text-muted-foreground">Track your typing progress and performance</p>
        </div>
        <Button onClick={onReturn} variant="outline" className="gap-2">
          <Home className="h-4 w-4" />
          Back to Menu
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalXP}</div>
            <p className="text-xs text-muted-foreground">Lifetime experience points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Total typing challenges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average XP</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgXP}</div>
            <p className="text-xs text-muted-foreground">Per session average</p>
          </CardContent>
        </Card>
      </div>

      {/* Challenge History */}
      <Card>
        <CardHeader>
          <CardTitle>Challenge History</CardTitle>
          <CardDescription>Your recent typing challenge sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No challenge sessions yet. Start typing to see your stats!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>XP Earned</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>WPM</TableHead>
                  <TableHead>Correct</TableHead>
                  <TableHead>Mistyped</TableHead>
                  <TableHead>Untyped</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: ChallengeSession, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{formatDate(session.timestamp)}</TableCell>
                    <TableCell className="text-primary font-semibold">
                      {Number(session.metrics.xpEarned)}
                    </TableCell>
                    <TableCell>{session.metrics.accuracyPercent.toFixed(1)}%</TableCell>
                    <TableCell>{Number(session.metrics.wpm)}</TableCell>
                    <TableCell className="text-green-600 dark:text-green-400">
                      {Number(session.metrics.correctWords)}
                    </TableCell>
                    <TableCell className="text-red-600 dark:text-red-400">
                      {Number(session.metrics.mistypedWords)}
                    </TableCell>
                    <TableCell className={Number(session.metrics.untypedWords) === 0 ? 'hidden' : ''}>
                      {Number(session.metrics.untypedWords)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
