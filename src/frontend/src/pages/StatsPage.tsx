import { useGetChallengeSessions } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Award, Calendar, TrendingUp, Home } from 'lucide-react';
import type { ChallengeSession } from '../backend';

interface StatsPageProps {
  onReturn: () => void;
}

export default function StatsPage({ onReturn }: StatsPageProps) {
  const { data: sessions, isLoading } = useGetChallengeSessions();

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
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading stats...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Your Statistics</h2>
        <p className="text-muted-foreground">Track your typing challenge performance</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Total XP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sessions Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average XP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgXP.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge History</CardTitle>
          <CardDescription>All your completed typing challenges</CardDescription>
        </CardHeader>
        <CardContent>
          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No challenges completed yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start your first challenge to see your stats here!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                    <TableHead className="text-right">Accuracy</TableHead>
                    <TableHead className="text-right">WPM</TableHead>
                    <TableHead className="text-right">Correct</TableHead>
                    <TableHead className="text-right">Mistyped</TableHead>
                    <TableHead className="text-right">Untyped</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session: ChallengeSession, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(session.timestamp)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {Number(session.metrics.xpEarned).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {session.metrics.accuracyPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(session.metrics.wpm)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(session.metrics.correctWords)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(session.metrics.mistypedWords)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(session.metrics.untypedWords) > 0 ? Number(session.metrics.untypedWords) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
