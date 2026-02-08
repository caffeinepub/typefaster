import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useIsCallerAdmin,
  useSetCompetitionState,
  useGetCompetitionState,
  useGetTransactionHistory,
  useGetUniqueVisitorsToday,
  useGetTotalVisitsToday,
  useGetTotalVisitors,
  useGetUsers,
  useGetAppCanisterBalance,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Home, Shield, Trophy, Wallet, Send, AlertTriangle, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { APP_PRINCIPAL, APP_ACCOUNT_ID } from '../config/appIdentity';
import SendICPPrizeModal from '../components/SendICPPrizeModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: competitionActive, isLoading: competitionLoading } = useGetCompetitionState();
  const setCompetitionState = useSetCompetitionState();
  const { data: transactions, isLoading: transactionsLoading } = useGetTransactionHistory();
  const { data: uniqueVisitorsToday } = useGetUniqueVisitorsToday();
  const { data: totalVisitsToday } = useGetTotalVisitsToday();
  const { data: totalVisitors } = useGetTotalVisitors();
  const { data: appBalance } = useGetAppCanisterBalance();
  const getUsersMutation = useGetUsers();

  const [showSendPrizeModal, setShowSendPrizeModal] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Load users when component mounts or page changes
  useEffect(() => {
    loadUsers(usersPage);
  }, [usersPage]);

  const loadUsers = async (page: number) => {
    setUsersLoading(true);
    try {
      const result = await getUsersMutation.mutateAsync(page);
      setUsersData(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCompetitionToggle = async (checked: boolean) => {
    try {
      await setCompetitionState.mutateAsync(checked);
      toast.success(checked ? 'Competition activated!' : 'Competition deactivated');
    } catch (error: any) {
      console.error('Failed to toggle competition:', error);
      toast.error('Failed to update competition state: ' + (error?.message || 'Unknown error'));
    }
  };

  const handlePageChange = (newPage: number) => {
    setUsersPage(newPage);
  };

  if (adminCheckLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="h-6 w-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">You do not have permission to access the admin dashboard.</p>
            <Button onClick={() => navigate({ to: '/menu' })} className="w-full gap-2">
              <Home className="h-4 w-4" />
              Return to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage competitions and prizes</p>
          </div>
        </div>
        <Button onClick={() => navigate({ to: '/menu' })} variant="outline" className="gap-2">
          <Home className="h-4 w-4" />
          Back to Menu
        </Button>
      </div>

      {/* App Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            App Canister Identity
          </CardTitle>
          <CardDescription>Backend canister principal and account identifier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Principal ID</Label>
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">{APP_PRINCIPAL}</div>
          </div>
          <div className="space-y-2">
            <Label>Account ID</Label>
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">{APP_ACCOUNT_ID}</div>
          </div>
          <div className="space-y-2">
            <Label>ICP Balance</Label>
            <div className="p-3 bg-muted rounded-lg font-mono text-sm">
              {appBalance ? (Number(appBalance) / 100_000_000).toFixed(8) : '0.00000000'} ICP
            </div>
            <p className="text-xs text-muted-foreground">
              Note: ICP balance and transfers are currently stubbed pending backend implementation
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Website Visitors Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Website Visitors
          </CardTitle>
          <CardDescription>Landing page visitor analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Unique visitors today (unique as in different IPs)</p>
              <p className="text-2xl font-bold">{uniqueVisitorsToday ? Number(uniqueVisitorsToday) : 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total visitors today</p>
              <p className="text-2xl font-bold">{totalVisitsToday ? Number(totalVisitsToday) : 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total visitors</p>
              <p className="text-2xl font-bold">{totalVisitors ? Number(totalVisitors) : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>Registered user profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : usersData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users registered yet</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Principal ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.map((user) => (
                    <TableRow key={user.principal.toString()}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="font-mono text-xs">{user.principal.toString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {usersData.length > 2 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => usersPage > 0 && handlePageChange(usersPage - 1)}
                        className={usersPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink>{usersPage + 1}</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => usersData.length === 20 && handlePageChange(usersPage + 1)}
                        className={usersData.length < 20 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Send ICP Prize Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send ICP Prize
          </CardTitle>
          <CardDescription>Transfer ICP from app canister to winners</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowSendPrizeModal(true)} className="gap-2">
            <Send className="h-4 w-4" />
            Send Prize
          </Button>
        </CardContent>
      </Card>

      {/* Competition Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Competition Controls
          </CardTitle>
          <CardDescription>Manage active competitions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="competition-toggle" className="text-base font-semibold">
                Competition Active
              </Label>
              <p className="text-sm text-muted-foreground">
                {competitionActive ? 'Players can compete for prizes' : 'Competition is currently inactive'}
              </p>
            </div>
            <Switch
              id="competition-toggle"
              checked={competitionActive || false}
              onCheckedChange={handleCompetitionToggle}
              disabled={competitionLoading || setCompetitionState.isPending}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Note:</span>
                <span>Admin users are automatically excluded from the leaderboard to ensure fair competition.</span>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Competition Rules Card */}
      <Card>
        <CardHeader>
          <CardTitle>Competition Rules</CardTitle>
          <CardDescription>How winners are determined</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Players are ranked by their highest single session XP</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Only non-admin users appear on the public leaderboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Competition must be active for prizes to be awarded</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Admins can send ICP prizes to winners manually using their Account IDs</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Transaction History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent ICP prize transfers</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(Number(tx.timestamp) / 1000000).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.to}</TableCell>
                    <TableCell>{(Number(tx.amount) / 100000000).toFixed(8)} ICP</TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.status === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }
                      >
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SendICPPrizeModal 
        open={showSendPrizeModal} 
        onOpenChange={setShowSendPrizeModal}
        currentBalance={appBalance || BigInt(0)}
      />
    </div>
  );
}
