# Specification

## Summary
**Goal:** Correct typed-word counting for empty/deleted input, and polish landing and results layouts while removing the Donate section.

**Planned changes:**
- Fix typed-word counting so it remains 0 until at least one non-whitespace character is present at level completion; ensure deleting all input returns the count to 0 and prevents progress/counters from advancing.
- Update any UI counters, progress displays, and gating logic that rely on typed-word counts to use the corrected calculation.
- Adjust landing page card layout on desktop so “Top Players” and “Get Started” cards match the combined height of two stacked small feature cards, while keeping mobile layout readable and non-overflowing.
- Polish results layout so the WPM “not available (test duration < 60 secs)” text fits on a single line, and adjust surrounding stat tiles for consistent sizing/padding/alignment and responsive behavior.
- Remove the “Donate here” footer/landing section (including donation account id) and ensure spacing remains intentional with no awkward gap.

**User-visible outcome:** The app shows accurate “Words typed”/progress when the input is empty or cleared, the landing and results pages look more balanced and professional across screen sizes, and the Donate section no longer appears.
