# Specification

## Summary
**Goal:** Fix typing challenge copy issues, simplify the main menu header area, and show/persist detailed completion performance stats per session.

**Planned changes:**
- Update TypingChallenge level paragraphs so each level text has an exact word count match (20/50/100/200/500) to prevent mismatch warnings.
- Remove the “Main Menu” title and “Choose an option to continue” subtitle from the main menu page.
- On typing session end (normal finish, early finish, or timeout), display: XP earned, accuracy %, WPM, correct words, mistyped words, and untyped words (only when > 0).
- Persist these completion metrics into saved challenge sessions in the backend, send the fields from the frontend when saving, and update the Stats page session table to display them (hiding untyped words when stored as 0) while keeping leaderboard XP behavior intact.

**User-visible outcome:** Players see corrected level texts, a cleaner main menu, detailed performance stats on completion, and those same metrics saved and visible for each session in the Stats page.
