import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat64 "mo:core/Nat64";

module {
  type UserProfile = {
    username : Text;
    principal : Principal.Principal;
    accountId : Text;
    isAdmin : Bool;
  };

  type ChallengeMetrics = {
    xpEarned : Int;
    accuracyPercent : Float;
    wpm : Int;
    correctWords : Int;
    mistypedWords : Int;
    untypedWords : Int;
  };

  type ChallengeSession = {
    user : Principal.Principal;
    timestamp : Int;
    metrics : ChallengeMetrics;
  };

  type ICPBalance = Nat64;
  type ICPAmount = Nat64;
  type ICPTransaction = {
    from : Text;
    to : Text;
    amount : ICPAmount;
    timestamp : Int;
    status : Text;
  };

  type VisitorCount = {
    totalVisits : Nat;
    uniqueVisitors : Nat;
    lastUpdated : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    challengeSessions : Map.Map<Principal.Principal, [ChallengeSession]>;
    canisterAccountId : ?Text;
    competitionActive : Bool;
    firstUserFlag : ?Principal.Principal;
    transactionHistory : Map.Map<Nat, ICPTransaction>;
    transactionCounter : Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    challengeSessions : Map.Map<Principal.Principal, [ChallengeSession]>;
    canisterAccountId : ?Text;
    competitionActive : Bool;
    firstUserFlag : ?Principal.Principal;
    transactionHistory : Map.Map<Nat, ICPTransaction>;
    transactionCounter : Nat;
    visitorCounts : Map.Map<Text, VisitorCount>;
  };

  public func run(old : OldActor) : NewActor {
    let visitorCounts = Map.empty<Text, VisitorCount>();
    { old with visitorCounts };
  };
};
