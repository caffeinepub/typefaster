# Specification

## Summary
**Goal:** Fix profile creation authorization for normal authenticated users and restore conditional time bonus XP in the typing challenge.

**Planned changes:**
- Backend: Update `createProfile(username)` so non-admin authenticated users can create a profile without hitting admin-only role assignment checks; automatically assign `#user` for non-first users and `#admin` for the first-ever user.
- Backend: Keep explicit admin-only role assignment APIs protected and unchanged for non-admin callers.
- Frontend: Restore time bonus XP calculation: award `timeRemaining * 5` only when the user completes the entire challenge with zero mistyped words, no skipped levels, and no skipped words; otherwise award 0 bonus.
- Frontend: Ensure the XP value sent to `saveChallengeSession` equals word-score XP plus the eligible time bonus.

**User-visible outcome:** Users can create a profile successfully without admin errors, and the typing challenge again awards time-based bonus XP only for fully completed, mistake-free, non-skipped runs.
