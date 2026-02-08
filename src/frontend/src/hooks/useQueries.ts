import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile } from '../types';
import type { ChallengeSession, ICPTransaction, ChallengeMetrics } from '../backend';

// Local type for frontend (using number instead of bigint for easier calculations)
interface LocalChallengeMetrics {
  xpEarned: number;
  accuracyPercent: number;
  wpm: number;
  correctWords: number;
  mistypedWords: number;
  untypedWords: number;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch (error: any) {
        // If the error is about unauthorized access, return null (new user)
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not found')) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: (failureCount, error: any) => {
      // Don't retry if it's an authorization error (new user)
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('not found')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useCreateProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProfile(username);
    },
    onSuccess: async (data) => {
      // Set cache data with the same queryKey shape as useGetCallerUserProfile
      const callerPrincipal = identity?.getPrincipal().toString();
      queryClient.setQueryData(['currentUserProfile', callerPrincipal], data);
      
      // Force refetch admin status to ensure it's up to date
      await queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      await queryClient.refetchQueries({ queryKey: ['isAdmin'] });
      
      // Invalidate other related queries
      queryClient.invalidateQueries({ queryKey: ['firstUserFlag'] });
    },
  });
}

export function useGetFirstUserFlag() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['firstUserFlag'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFirstUserFlag();
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}

export function useGetChallengeSessions() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ChallengeSession[]>({
    queryKey: ['challengeSessions', identity?.getPrincipal().toString()],
    queryFn: async (): Promise<ChallengeSession[]> => {
      if (!actor) return [];
      return actor.getUserChallengeSessions();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSaveChallengeSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metrics: LocalChallengeMetrics) => {
      if (!actor) throw new Error('Actor not available');
      
      // Convert local metrics (number) to backend format (bigint)
      const backendMetrics: ChallengeMetrics = {
        xpEarned: BigInt(Math.round(metrics.xpEarned)),
        accuracyPercent: metrics.accuracyPercent,
        wpm: BigInt(Math.round(metrics.wpm)),
        correctWords: BigInt(Math.round(metrics.correctWords)),
        mistypedWords: BigInt(Math.round(metrics.mistypedWords)),
        untypedWords: BigInt(Math.round(metrics.untypedWords)),
      };
      
      return actor.saveChallengeSession(backendMetrics);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['publicLeaderboard'] });
    },
  });
}

export function useGetLeaderboard() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[string, bigint]>>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPublicLeaderboard() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[string, bigint]>>({
    queryKey: ['publicLeaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCompetitionState() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['competitionState'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getCompetitionState();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetCompetitionState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (active: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCompetitionState(active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitionState'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useGetCanisterAccountId() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['canisterAccountId'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCanisterAccountId();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Stub for missing backend method - returns mock balance
export function useGetAppCanisterBalance() {
  return useQuery<bigint>({
    queryKey: ['appCanisterBalance'],
    queryFn: async () => {
      // Backend method not yet implemented
      // Return mock balance of 0 ICP
      return BigInt(0);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Stub for missing backend method - simulates prize sending
export function useSendICPPrize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientAccountId, amount }: { recipientAccountId: string; amount: bigint }) => {
      // Backend method not yet implemented
      throw new Error('ICP prize sending is not yet implemented in the backend. Please implement sendICPPrize method.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appCanisterBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    },
  });
}

// Stub for missing backend method - simulates withdrawal
export function useWithdrawICP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientAccountId, amount }: { recipientAccountId: string; amount: bigint }) => {
      // Backend method not yet implemented
      throw new Error('ICP withdrawal is not yet implemented in the backend. Please implement withdrawICP method.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appCanisterBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    },
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ICPTransaction[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}
