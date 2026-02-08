import { useState } from 'react';
import { useGetCallerUserProfile, useWithdrawICP, useGetAppCanisterBalance } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wallet, Copy, Send, Home, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletPageProps {
  onReturn: () => void;
}

export default function WalletPage({ onReturn }: WalletPageProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const withdrawICP = useWithdrawICP();
  const { data: appBalance } = useGetAppCanisterBalance();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Stubbed balance - ICP integration not yet implemented
  const userBalance = BigInt(0);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleWithdraw = async () => {
    if (!userProfile) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountE8s = BigInt(Math.floor(amount * 100_000_000));

    if (amountE8s > userBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      await withdrawICP.mutateAsync({
        accountId: userProfile.accountId,
        amount: amountE8s,
      });
      toast.success('Withdrawal successful!');
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error?.message || 'Withdrawal failed. This feature is not yet implemented.');
    }
  };

  const formatICP = (amount: bigint): string => {
    const e8s = Number(amount);
    return (e8s / 100_000_000).toFixed(8);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your ICP balance and account</p>
        </div>
        <Button onClick={onReturn} variant="outline" className="gap-2">
          <Home className="h-4 w-4" />
          Back to Menu
        </Button>
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            ICP Balance
          </CardTitle>
          <CardDescription>Your current Internet Computer Protocol token balance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold text-primary">{formatICP(userBalance)} ICP</div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ICP balance and withdrawal features are currently under development. Prize distributions will be handled
              by admins manually.
            </AlertDescription>
          </Alert>
          <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled>
                <Send className="h-4 w-4" />
                Withdraw ICP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw ICP</DialogTitle>
                <DialogDescription>Transfer ICP from your wallet to your account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ICP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.00000001"
                    min="0"
                    placeholder="0.00000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={withdrawICP.isPending}
                  />
                  <p className="text-xs text-muted-foreground">Available: {formatICP(userBalance)} ICP</p>
                </div>
                {withdrawICP.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {withdrawICP.error?.message || 'Withdrawal failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}
                {withdrawICP.isSuccess && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">Withdrawal successful!</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWithdraw} disabled={withdrawICP.isPending || !withdrawAmount}>
                  {withdrawICP.isPending ? 'Processing...' : 'Confirm Withdrawal'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your Internet Computer identifiers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Principal ID</Label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {userProfile?.principal.toString()}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(userProfile?.principal.toString() || '', 'Principal ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account ID</Label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {userProfile?.accountId}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(userProfile?.accountId || '', 'Account ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this Account ID to receive ICP transfers from the app canister
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
