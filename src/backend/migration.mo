import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";

module {
  type OldChallengeSession = {
    user : Principal;
    timestamp : Int;
    xpEarned : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, {
      username : Text;
      principal : Principal;
      accountId : Text;
      isAdmin : Bool;
    }>;
    challengeSessions : Map.Map<Principal, [OldChallengeSession]>;
    canisterAccountId : ?Text;
    competitionActive : Bool;
    firstUserFlag : ?Principal;
    transactionHistory : Map.Map<Nat, {
      from : Text;
      to : Text;
      amount : Nat64;
      timestamp : Int;
      status : Text;
    }>;
    transactionCounter : Nat;
  };

  type ChallengeMetrics = {
    xpEarned : Int;
    accuracyPercent : Float;
    wpm : Int;
    correctWords : Int;
    mistypedWords : Int;
    untypedWords : Int;
  };

  type NewChallengeSession = {
    user : Principal;
    timestamp : Int;
    metrics : ChallengeMetrics;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, {
      username : Text;
      principal : Principal;
      accountId : Text;
      isAdmin : Bool;
    }>;
    challengeSessions : Map.Map<Principal, [NewChallengeSession]>;
    canisterAccountId : ?Text;
    competitionActive : Bool;
    firstUserFlag : ?Principal;
    transactionHistory : Map.Map<Nat, {
      from : Text;
      to : Text;
      amount : Nat64;
      timestamp : Int;
      status : Text;
    }>;
    transactionCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newChallengeSessions = old.challengeSessions.map<Principal, [OldChallengeSession], [NewChallengeSession]>(
      func(_principal, oldSessions) {
        oldSessions.map(
          func(oldSession) {
            {
              user = oldSession.user;
              timestamp = oldSession.timestamp;
              metrics = {
                xpEarned = oldSession.xpEarned;
                accuracyPercent = 0.0;
                wpm = 0;
                correctWords = 0;
                mistypedWords = 0;
                untypedWords = 0;
              };
            };
          }
        );
      },
    );

    {
      old with
      challengeSessions = newChallengeSessions;
    };
  };
};
