import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ICPAmount = bigint;
export interface ChallengeSession {
    user: Principal;
    timestamp: bigint;
    xpEarned: bigint;
}
export interface ICPTransaction {
    to: string;
    status: string;
    from: string;
    timestamp: bigint;
    amount: ICPAmount;
}
export interface UserProfile {
    principal: Principal;
    username: string;
    accountId: string;
    isAdmin: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserRole(user: Principal, role: UserRole): Promise<void>;
    createProfile(username: string): Promise<UserProfile>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanisterAccountId(): Promise<string | null>;
    getCompetitionState(): Promise<boolean>;
    getFirstUserFlag(): Promise<Principal | null>;
    getLeaderboard(): Promise<Array<[string, bigint]>>;
    getTransactionHistory(): Promise<Array<ICPTransaction>>;
    getUserChallengeSessions(): Promise<Array<ChallengeSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveChallengeSession(xpEarned: bigint): Promise<void>;
    setCanisterAccountId(accountId: string): Promise<void>;
    setCompetitionState(state: boolean): Promise<void>;
}
