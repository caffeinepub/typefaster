import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat64 "mo:core/Nat64";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type UserProfile = {
    username : Text;
    principal : Principal;
    accountId : Text;
    isAdmin : Bool;
  };

  type ChallengeMetrics = {
    correctWords : Int;
    mistypedWords : Int;
    untypedWords : Int;
    accuracyPercent : Float;
    wpm : Int;
    xpEarned : Int;
  };

  type ChallengeSession = {
    user : Principal;
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

  let userProfiles = Map.empty<Principal, UserProfile>();
  let challengeSessions = Map.empty<Principal, [ChallengeSession]>();
  var canisterAccountId : ?Text = null;
  var competitionActive : Bool = false;
  var firstUserFlag : ?Principal = null;

  let transactionHistory = Map.empty<Nat, ICPTransaction>();
  var transactionCounter : Nat = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query func getLeaderboard() : async [(Text, Int)] {
    // Public leaderboard - accessible to everyone including guests
    let profiles = userProfiles.toArray();
    let leaderboardData = profiles.map(
      func(p, profile) {
        let bestSessionXP = calculateBestSessionXP(p);
        (profile.username, bestSessionXP);
      }
    );

    let filteredLeaderboardData = leaderboardData.filter(
      func(entry) {
        for ((_, userProfile) in userProfiles.entries()) {
          if (userProfile.username == entry.0 and userProfile.isAdmin) {
            return false;
          };
        };
        true;
      }
    );

    filteredLeaderboardData.sort<(Text, Int)>(
      func(a, b) {
        if (a.1 > b.1) { #less } else if (a.1 < b.1) { #greater } else { #equal };
      }
    );
  };

  public query ({ caller }) func getFirstUserFlag() : async ?Principal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view first user flag");
    };
    firstUserFlag;
  };

  public query ({ caller }) func getCanisterAccountId() : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view canister account ID");
    };
    canisterAccountId;
  };

  public query func getCompetitionState() : async Bool {
    // Public competition state - accessible to everyone including guests
    competitionActive;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or must be admin");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getUserChallengeSessions() : async [ChallengeSession] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their challenge sessions");
    };
    switch (challengeSessions.get(caller)) {
      case (?sessions) { sessions };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func createProfile(username : Text) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };

    switch (userProfiles.get(caller)) {
      case (?_) {
        Runtime.trap("Profile already exists for this user");
      };
      case (null) {};
    };

    if (username == "") {
      Runtime.trap("Username cannot be empty");
    };

    let profiles = userProfiles.toArray();
    let usernameTaken = profiles.foldLeft(
      false,
      func(acc, p) {
        if (p.1.username == username) {
          return true;
        };
        acc;
      },
    );
    if (usernameTaken) {
      Runtime.trap("Username already taken");
    };

    let isFirstUser = firstUserFlag == null;

    let userProfile : UserProfile = {
      username;
      principal = caller;
      accountId = "generated_account_" # username;
      isAdmin = isFirstUser;
    };

    if (isFirstUser) {
      firstUserFlag := ?caller;
    } else { () };

    userProfiles.add(caller, userProfile);
    userProfile;
  };

  public shared ({ caller }) func saveChallengeSession(metrics : ChallengeMetrics) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save challenge sessions");
    };

    let normalizedMetrics : ChallengeMetrics = {
      metrics with
      xpEarned = (metrics.correctWords * 5) - (metrics.mistypedWords * 10);
    };

    let session : ChallengeSession = {
      user = caller;
      timestamp = Time.now();
      metrics = normalizedMetrics;
    };

    switch (challengeSessions.get(caller)) {
      case (?existingSessions) {
        let updatedSessions = existingSessions.concat([session]);
        challengeSessions.add(caller, updatedSessions);
      };
      case (null) {
        challengeSessions.add(caller, [session]);
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        let updatedProfile : UserProfile = {
          username = profile.username;
          principal = existingProfile.principal;
          accountId = existingProfile.accountId;
          isAdmin = existingProfile.isAdmin;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {
        Runtime.trap("Profile does not exist. Create profile first.");
      };
    };
  };

  public shared ({ caller }) func setCompetitionState(state : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set competition state");
    };
    competitionActive := state;
  };

  public shared ({ caller }) func setCanisterAccountId(accountId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set canister account ID");
    };
    canisterAccountId := ?accountId;
  };

  public shared ({ caller }) func assignUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func getTransactionHistory() : async [ICPTransaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view transaction history");
    };

    let transactions = transactionHistory.toArray();
    transactions.map(func(_, tx) { tx });
  };

  private func calculateBestSessionXP(user : Principal) : Int {
    switch (challengeSessions.get(user)) {
      case (?sessions) {
        if (sessions.size() == 0) { return 0 };
        var best : Int = sessions[0].metrics.xpEarned;
        for (session in sessions.vals()) {
          if (session.metrics.xpEarned > best) {
            best := session.metrics.xpEarned;
          };
        };
        best;
      };
      case (null) { 0 };
    };
  };
};
