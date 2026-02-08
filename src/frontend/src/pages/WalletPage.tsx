import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wallet, Send, AlertCircle, Home, Copy, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetCallerUserProfile, useWithdrawICP, useGetAppCanisterBalance } from '../hooks/useQueries';
import { principalToAccountIdentifier } from '../lib/accountId';
import { toast } from 'sonner';

interface WalletPageProps {
  onReturn: () => void;
}

export default function WalletPage({ onReturn }: WalletPageProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountIdLoading, setAccountIdLoading] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: appBalance, isLoading: balanceLoading, refetch: refetchBalance } = useGetAppCanisterBalance();
  const withdrawICP = useWithdrawICP();

  // Generate proper ICP Account ID from Principal
  useEffect(() => {
    if (!userProfile) {
      setAccountId(null);
      return;
    }

    setAccountIdLoading(true);
    principalToAccountIdentifier(userProfile.principal)
      .then((id) => {
        setAccountId(id);
        setAccountIdLoading(false);
      })
      .catch((error) => {
        console.error('Error generating account ID:', error);
        setAccountId(null);
        setAccountIdLoading(false);
      });
  }, [userProfile]);

  const formatICP = (amount: bigint): string => {
    const e8s = Number(amount);
    return (e8s / 100_000_000).toFixed(8);
  };

  const handleWithdraw = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter valid recipient and amount');
      return;
    }

    try {
      // Convert ICP amount to e8s (1 ICP = 100,000,000 e8s)
      const amountInE8s = BigInt(Math.floor(parseFloat(amount) * 100_000_000));

      const result = await withdrawICP.mutateAsync({
        recipientAccountId: recipient,
        amount: amountInE8s,
      });

      toast.success(result || 'Withdrawal successful!');
      setIsOpen(false);
      setRecipient('');
      setAmount('');
      
      // Refetch balance after successful withdrawal
      await refetchBalance();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      const errorMessage = error?.message || 'Failed to process withdrawal';
      toast.error(errorMessage);
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Your Wallet</h2>
        <p className="text-muted-foreground">Manage your ICP balance and withdrawals</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ICP ledger integration is pending backend implementation. Withdrawal functionality will be available once the backend methods are deployed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Available ICP Balance
          </CardTitle>
          <CardDescription>Current balance available for withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-5xl font-bold">
              {balanceLoading ? '...' : formatICP(appBalance || BigInt(0))}
            </p>
            <p className="text-muted-foreground mt-2">ICP</p>
          </div>

          <div className="mt-8 space-y-4 border-t pt-6">
            {profileLoading ? (
              <div className="text-center text-muted-foreground">Fetching profile data...</div>
            ) : userProfile ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Principal ID:</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <code className="flex-1 text-xs break-all">
                      {userProfile.principal.toString()}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(userProfile.principal.toString(), 'principal')}
                      className="shrink-0"
                    >
                      {copiedField === 'principal' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account ID:</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    {accountIdLoading ? (
                      <span className="flex-1 text-xs text-muted-foreground">Generating...</span>
                    ) : accountId ? (
                      <>
                        <code className="flex-1 text-xs break-all">{accountId}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(accountId, 'account')}
                          className="shrink-0"
                        >
                          {copiedField === 'account' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <span className="flex-1 text-xs text-muted-foreground">
                        Unable to generate account ID
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">Profile data not available</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw ICP</CardTitle>
          <CardDescription>Transfer ICP to another account</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Withdraw ICP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw ICP</DialogTitle>
                <DialogDescription>
                  Enter the recipient's Account ID and the amount to transfer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Account ID</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter Account ID (64 hex characters)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={withdrawICP.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a valid ICP account identifier
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ICP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={withdrawICP.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: 0.0001 ICP
                  </p>
                </div>
                {withdrawICP.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {withdrawICP.error?.message || 'Failed to process withdrawal'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={withdrawICP.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={!recipient || !amount || parseFloat(amount) <= 0 || withdrawICP.isPending}
                >
                  {withdrawICP.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
