import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, ChallengeSession, ICPTransaction } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// Local type for frontend calculations (using number instead of bigint)
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

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useCreateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createProfile(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserChallengeSessions() {
  const { actor, isFetching } = useActor();

  return useQuery<ChallengeSession[]>({
    queryKey: ['userChallengeSessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserChallengeSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveChallengeSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metrics: LocalChallengeMetrics) => {
      if (!actor) throw new Error('Actor not available');
      
      // Convert LocalChallengeMetrics (number-based) to backend ChallengeMetrics (bigint-based)
      const backendMetrics = {
        xpEarned: BigInt(metrics.xpEarned),
        accuracyPercent: metrics.accuracyPercent,
        wpm: BigInt(metrics.wpm),
        correctWords: BigInt(metrics.correctWords),
        mistypedWords: BigInt(metrics.mistypedWords),
        untypedWords: BigInt(metrics.untypedWords),
      };
      
      return actor.saveChallengeSession(backendMetrics);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChallengeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, bigint]>>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCompetitionState() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['competitionState'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getCompetitionState();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCompetitionState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (state: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCompetitionState(state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitionState'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCanisterAccountId() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['canisterAccountId'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCanisterAccountId();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCanisterAccountId() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCanisterAccountId(accountId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canisterAccountId'] });
    },
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<ICPTransaction[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordVisitor() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (visitorId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordVisitor(visitorId);
    },
  });
}

export function useGetUniqueVisitorsToday() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['uniqueVisitorsToday'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUniqueVisitorsToday();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalVisitsToday() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalVisitsToday'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalVisitsToday();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalVisitors() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalVisitors'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalVisitors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUsers() {
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (page: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUsers(BigInt(page));
    },
  });
}

export function useGetFirstUserFlag() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal | null>({
    queryKey: ['firstUserFlag'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFirstUserFlag();
    },
    enabled: !!actor && !isFetching,
  });
}

// Stubbed ICP-related hooks (not yet implemented in backend)
export function useSendICPPrize() {
  return useMutation({
    mutationFn: async (_params: { recipientAccountId: string; amount: bigint }) => {
      throw new Error('ICP prize sending is not yet implemented in the backend');
    },
  });
}

export function useWithdrawICP() {
  return useMutation({
    mutationFn: async (_params: { accountId: string; amount: bigint }) => {
      throw new Error('ICP withdrawal is not yet implemented in the backend');
    },
  });
}

export function useGetAppCanisterBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['appCanisterBalance'],
    queryFn: async () => {
      // Stubbed - return 0 until backend implements this
      return BigInt(0);
    },
    enabled: !!actor && !isFetching,
  });
}
