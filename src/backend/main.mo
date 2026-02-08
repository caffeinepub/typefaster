import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat64 "mo:core/Nat64";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  type UserProfile = {
    username : Text;
    principal : Principal;
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

  type VisitorCount = {
    totalVisits : Nat;
    uniqueVisitors : Nat;
    lastUpdated : Int;
  };

  type AdminDashboardMetrics = {
    uniqueVisitorsToday : Nat;
    totalVisitsToday : Nat;
    totalVisitors : Nat;
    userCount : Nat;
    dailyActiveUsers : Nat;
    avgSessionDuration : Nat;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let challengeSessions = Map.empty<Principal, [ChallengeSession]>();
  var canisterAccountId : ?Text = null;
  var competitionActive : Bool = false;
  var firstUserFlag : ?Principal = null;

  let transactionHistory = Map.empty<Nat, ICPTransaction>();
  var transactionCounter : Nat = 0;
  let visitorCounts = Map.empty<Text, VisitorCount>();

  public query func getLeaderboard() : async [(Text, Int)] {
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

  public query ({ caller }) func getTotalVisitors() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view total visitors");
    };

    let count = visitorCounts.toArray().foldLeft(0, func(acc, entry) { acc + entry.1.totalVisits });
    count;
  };

  public query ({ caller }) func getTotalUniqueVisitors() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view total unique visitors");
    };

    let count = visitorCounts.toArray().foldLeft(0, func(acc, entry) { acc + entry.1.uniqueVisitors });
    count;
  };

  public query ({ caller }) func getUsers(page : Nat) : async [UserProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view users list");
    };

    let allUsers = userProfiles.toArray();
    // Filter out admin profiles from the results,
    let filteredUsers = allUsers.filter(func(t) { t.1.isAdmin == false });
    let usersArray = filteredUsers.map(func(entry) { entry.1 });

    let startIndex = page * 20;
    if (startIndex >= usersArray.size()) { return [] };

    let endIndex = Nat.min((startIndex + 20), usersArray.size());

    usersArray.sliceToArray(startIndex, endIndex);
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
    };

    userProfiles.add(caller, userProfile);
    userProfile;
  };

  public shared ({ caller }) func saveChallengeSession(metrics : ChallengeMetrics) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save challenge sessions");
    };

    let session : ChallengeSession = {
      user = caller;
      timestamp = Time.now();
      metrics;
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

  public shared func recordVisitor(visitorId : Text) : async () {
    // Public function - must be accessible to all visitors including guests
    // This is called when the landing page loads to track visitor statistics
    let today = Time.now();

    switch (visitorCounts.get(visitorId)) {
      case (?counts) {
        let todayCounts = if (counts.lastUpdated == today) {
          {
            counts with totalVisits = counts.totalVisits + 1;
          };
        } else {
          {
            totalVisits = 1;
            uniqueVisitors = 1;
            lastUpdated = today;
          };
        };
        visitorCounts.add(visitorId, todayCounts);
      };
      case (null) {
        visitorCounts.add(
          visitorId,
          {
            totalVisits = 1;
            uniqueVisitors = 1;
            lastUpdated = today;
          },
        );
      };
    };
  };

  public query ({ caller }) func getUniqueVisitorsToday() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view unique visitors today");
    };

    let today = Time.now();
    let count = visitorCounts.toArray().foldLeft(0, func(acc, entry) { acc + entry.1.uniqueVisitors });
    count;
  };

  public query ({ caller }) func getTotalVisitsToday() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view total visits today");
    };

    let today = Time.now();
    let count = visitorCounts.toArray().foldLeft(0, func(acc, entry) { acc + entry.1.totalVisits });
    count;
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
