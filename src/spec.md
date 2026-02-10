# Specification

## Summary
**Goal:** Redeploy the current draft backend as a brand-new canister (new canister ID) without changing backend behavior and without any frontend changes.

**Planned changes:**
- Deploy the existing draft backend to a newly created backend canister (resulting in a different canister principal/ID than the prior draft backend).
- Record the newly deployed backend canister principal/ID as an explicit deployment output for verification/debugging.

**User-visible outcome:** The backend is available under a new canister ID, with the same behavior as before, and the new canister principal/ID is available for reference.
