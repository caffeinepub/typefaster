import type { Principal } from '@dfinity/principal';

// Type definitions matching backend interface
export interface UserProfile {
  username: string;
  principal: Principal;
  accountId: string;
  isAdmin: boolean;
}

// Import ChallengeSession from backend interface instead of defining locally
// The backend ChallengeSession has: user, timestamp (bigint), xpEarned (bigint)
