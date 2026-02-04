import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import { useSendICPPrize } from '../hooks/useQueries';
import { toast } from 'sonner';

interface SendICPPrizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: bigint;
}

export default function SendICPPrizeModal({ open, onOpenChange, currentBalance }: SendICPPrizeModalProps) {
  const [recipientAccountId, setRecipientAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const sendICPPrize = useSendICPPrize();

  const formatICP = (amount: bigint): string => {
    const e8s = Number(amount);
    return (e8s / 100_000_000).toFixed(8);
  };

  const parseICPToE8s = (icpAmount: string): bigint | null => {
    try {
      const num = parseFloat(icpAmount);
      if (isNaN(num) || num <= 0) return null;
      return BigInt(Math.floor(num * 100_000_000));
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientAccountId.trim()) {
      toast.error('Please enter a recipient account ID');
      return;
    }

    const amountE8s = parseICPToE8s(amount);
    if (!amountE8s) {
      toast.error('Please enter a valid ICP amount');
      return;
    }

    if (amountE8s > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const result = await sendICPPrize.mutateAsync({
        recipientAccountId: recipientAccountId.trim(),
        amount: amountE8s,
      });

      setSuccessMessage(result);
      setShowSuccess(true);
      toast.success('ICP prize sent successfully!');

      // Reset form after short delay
      setTimeout(() => {
        setRecipientAccountId('');
        setAmount('');
        setShowSuccess(false);
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Failed to send ICP prize:', error);
      toast.error(error?.message || 'Failed to send ICP prize');
    }
  };

  const handleClose = () => {
    if (!sendICPPrize.isPending) {
      setRecipientAccountId('');
      setAmount('');
      setShowSuccess(false);
      setSuccessMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Send ICP Prize
          </DialogTitle>
          <DialogDescription>
            Transfer ICP from the app canister to a user's account ID
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="py-6">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                {successMessage}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Available Balance</Label>
              <div className="text-2xl font-bold text-primary">
                {formatICP(currentBalance)} ICP
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Account ID</Label>
              <Input
                id="recipient"
                placeholder="Enter account ID"
                value={recipientAccountId}
                onChange={(e) => setRecipientAccountId(e.target.value)}
                disabled={sendICPPrize.isPending}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The ICP account ID of the recipient
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ICP)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={sendICPPrize.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount in ICP (e.g., 1.5 for 1.5 ICP)
              </p>
            </div>

            {sendICPPrize.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {sendICPPrize.error?.message || 'Failed to send ICP prize. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={sendICPPrize.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendICPPrize.isPending || !recipientAccountId.trim() || !amount}
                className="gap-2"
              >
                {sendICPPrize.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    Send ICP
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

