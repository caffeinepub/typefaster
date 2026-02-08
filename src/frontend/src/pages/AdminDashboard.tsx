import { useState, useEffect } from 'react';
import {
  useGetCompetitionState,
  useSetCompetitionState,
  useIsCallerAdmin,
  useGetAppCanisterBalance,
  useGetTransactionHistory,
} from '../hooks/useQueries';
import { getAppCanisterPrincipalString, getAppCanisterAccountIdString } from '../config/appIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Crown, Home, Coins, History, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import SendICPPrizeModal from '../components/SendICPPrizeModal';

interface AdminDashboardProps {
  onReturn: () => void;
}

export default function AdminDashboard({ onReturn }: AdminDashboardProps) {
  const [sendPrizeModalOpen, setSendPrizeModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appPrincipalString, setAppPrincipalString] = useState<string>('Loading...');
  const [appAccountIdString, setAppAccountIdString] = useState<string>('Loading...');
  
  const { data: competitionActive, isLoading: stateLoading } = useGetCompetitionState();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: appBalance, isLoading: balanceLoading } = useGetAppCanisterBalance();
  const { data: transactionHistory, isLoading: historyLoading } = useGetTransactionHistory();
  const setCompetitionState = useSetCompetitionState();

  // Load app identity from frontend config on mount
  useEffect(() => {
    const principal = getAppCanisterPrincipalString();
    setAppPrincipalString(principal);

    getAppCanisterAccountIdString().then((accountId) => {
      setAppAccountIdString(accountId);
    });
  }, []);

  const handleToggle = async (checked: boolean) => {
    try {
      await setCompetitionState.mutateAsync(checked);
      toast.success(checked ? 'Competition started!' : 'Competition stopped!');
    } catch (error) {
      console.error('Failed to update competition state:', error);
      toast.error('Failed to update competition state');
    }
  };

  const formatICP = (amount: bigint): string => {
    const e8s = Number(amount);
    return (e8s / 100_000_000).toFixed(8);
  };

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString();
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (adminLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Verifying permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-destructive" />
          <div>
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have admin privileges</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only the app owner can access the admin dashboard. The first user to create a profile after deployment
            automatically becomes the owner and admin.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center pt-4">
          <Button onClick={onReturn} variant="outline" size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage daily competitions and rewards</p>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You are the app owner with full admin privileges. You were the first user to create a profile after
          deployment.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            App Canister Identity
          </CardTitle>
          <CardDescription>The app's canister ID from deployment configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Canister Principal ID:</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <code className="flex-1 text-xs break-all">{appPrincipalString}</code>
                {appPrincipalString !== 'Not available' && appPrincipalString !== 'Loading...' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(appPrincipalString, 'principal')}
                    className="shrink-0"
                  >
                    {copiedField === 'principal' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Canister Account ID:</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <code className="flex-1 text-xs break-all font-mono">{appAccountIdString}</code>
                {appAccountIdString !== 'Not available' && appAccountIdString !== 'Loading...' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(appAccountIdString, 'account')}
                    className="shrink-0"
                  >
                    {copiedField === 'account' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This canister identity is read from deployment configuration and the account ID is derived client-side. Use this for ICP prize distribution and ledger operations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            App Canister Balance
          </CardTitle>
          <CardDescription>Current ICP balance available for prize distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {balanceLoading ? 'Loading...' : `${formatICP(appBalance || BigInt(0))} ICP`}
              </p>
              <p className="text-sm text-muted-foreground">Available for distribution</p>
            </div>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ICP ledger integration is pending backend implementation. Balance and prize distribution will be functional once backend methods are deployed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send ICP Prize</CardTitle>
          <CardDescription>Distribute ICP rewards to users from the app canister</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Transfer ICP from the app canister to any user account ID for manual reward distribution.
          </p>
          <Button onClick={() => setSendPrizeModalOpen(true)} className="gap-2">
            <Coins className="w-4 h-4" />
            Send ICP Prize
          </Button>
        </CardContent>
      </Card>

      {transactionHistory && transactionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Transaction History
            </CardTitle>
            <CardDescription>Recent ICP prize distributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Loading transactions...</p>
              ) : (
                transactionHistory.slice(0, 5).map((tx, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">To: {tx.to.substring(0, 20)}...</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(tx.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatICP(tx.amount)} ICP</p>
                      <p className="text-xs text-green-500">{tx.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily Competition</CardTitle>
          <CardDescription>
            Control the daily typing competition. When active, users compete for daily rewards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="competition-toggle" className="text-base">
                Competition Status
              </Label>
              <p className="text-sm text-muted-foreground">
                {competitionActive ? 'Competition is currently active' : 'Competition is currently inactive'}
              </p>
            </div>
            <Switch
              id="competition-toggle"
              checked={competitionActive || false}
              onCheckedChange={handleToggle}
              disabled={stateLoading || setCompetitionState.isPending}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Note: Automatic reward distribution at the end of each day is not yet implemented in the backend. The
              competition state is tracked, but winners will need to be rewarded manually using the "Send ICP Prize"
              feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competition Rules</CardTitle>
          <CardDescription>How the daily competition works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <p className="flex-1">When active, all challenge sessions count toward the daily leaderboard</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <p className="flex-1"><strong>The user with the highest individual session score wins</strong></p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <p className="flex-1">Winner receives 1 ICP automatically at the end of the day</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <p className="flex-1">Competition resets daily at midnight UTC</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <p className="flex-1">Admin users are excluded from public leaderboards and competition rankings</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pb-6">
        <Button onClick={onReturn} variant="outline" size="lg" className="gap-2">
          <Home className="w-4 h-4" />
          Return to Menu
        </Button>
      </div>

      <SendICPPrizeModal
        open={sendPrizeModalOpen}
        onOpenChange={setSendPrizeModalOpen}
        currentBalance={appBalance || BigInt(0)}
      />
    </div>
  );
}
