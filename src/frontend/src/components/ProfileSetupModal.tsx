import { useState } from 'react';
import { useCreateProfile, useGetFirstUserFlag } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { User, Info, Crown } from 'lucide-react';

export default function ProfileSetupModal() {
  const [username, setUsername] = useState('');
  const createProfile = useCreateProfile();
  const { data: firstUserFlag, isLoading: firstUserFlagLoading } = useGetFirstUserFlag();

  const isFirstUser = firstUserFlag === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      await createProfile.mutateAsync(username.trim());
      toast.success(
        isFirstUser 
          ? 'Welcome! You are now the admin and owner of TypeFaster.' 
          : 'Profile created successfully! Welcome to TypeFaster.'
      );
    } catch (error: any) {
      console.error('Profile creation error:', error);
      const errorMessage = error?.message || 'Failed to create profile';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isFirstUser ? (
              <>
                <Crown className="w-5 h-5 text-chart-4" />
                Welcome, First User!
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-primary" />
                Welcome to TypeFaster!
              </>
            )}
          </CardTitle>
          <CardDescription>
            Choose a username to get started with your typing challenges and compete 
            for XP and ICP rewards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {firstUserFlagLoading ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Checking first user status...
              </AlertDescription>
            </Alert>
          ) : isFirstUser ? (
            <Alert className="border-chart-4/50 bg-chart-4/10">
              <Crown className="h-4 w-4 text-chart-4" />
              <AlertDescription className="text-foreground">
                🎉 You are the first user! You will automatically receive admin and owner 
                privileges, giving you access to the Admin Dashboard and competition controls.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Create your profile to start competing in typing challenges and earning XP.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                autoFocus
                disabled={createProfile.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createProfile.isPending || firstUserFlagLoading}
            >
              {createProfile.isPending ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
