# Specification

## Summary
**Goal:** Correct Typing Challenge final word-count results across the full 5-level run, improve landing page Top Players display with expand/collapse, and add Admin Dashboard sections for visitor analytics and user listing.

**Planned changes:**
- Fix final results word counting to aggregate correct/mistyped/typed/untyped totals across all 5 levels (including when levels are skipped via Next), based on ordered word-to-word comparison against each level’s paragraph.
- Update landing page “Top Players” card to show only the top 3 scores by default, with a '^' toggle to expand/collapse the remaining players.
- Add landing-page-only visit tracking: fetch IP via ipify, anonymize client-side, send to backend, and store data needed to compute unique visitors today, total visitors today, and total visitors.
- Add Admin Dashboard “Website visitors” section displaying exactly: Unique visitors today, Total visitors today, Total visitors.
- Add Admin Dashboard “Users” section listing registered user profile names; paginate at 20 users/page when total users > 2, with page navigation controls.

**User-visible outcome:** Players see accurate final word counts for the full run, the landing leaderboard initially shows only the top 3 with an expand/collapse toggle, and admins can view visitor metrics plus a paginated list of registered users in the Admin Dashboard.
