import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, BarChart3, Wallet, Trophy } from 'lucide-react';
import type { Page } from '../App';

interface MainMenuProps {
  onNavigate: (page: Page) => void;
}

export default function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Main Menu</h2>
        <p className="text-muted-foreground">Choose an option to continue</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate('challenge')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle>Start Typing</CardTitle>
                <CardDescription>Begin a new challenge</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete 5 levels in 10 minutes. Earn XP for accuracy and speed!
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate('stats')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-chart-2/10 group-hover:bg-chart-2/20 transition-colors">
                <BarChart3 className="w-8 h-8 text-chart-2" />
              </div>
              <div>
                <CardTitle>Stats</CardTitle>
                <CardDescription>View your performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check your challenge history and track your progress over time.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate('wallet')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-chart-4/10 group-hover:bg-chart-4/20 transition-colors">
                <Wallet className="w-8 h-8 text-chart-4" />
              </div>
              <div>
                <CardTitle>Wallet</CardTitle>
                <CardDescription>Manage your ICP</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View your balance and withdraw ICP to your account.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigate('leaderboard')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-chart-1/10 group-hover:bg-chart-1/20 transition-colors">
                <Trophy className="w-8 h-8 text-chart-1" />
              </div>
              <div>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>See top players</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare your XP with other players and climb the ranks!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
