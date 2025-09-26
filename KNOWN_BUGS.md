# Known Bugs & Issue Intake

Last reviewed: 2025-09-26

All previously listed issues require **revalidation** after recent scroll, reaction, and accessibility refactors. Instead of keeping a stale, granular list here, we now centralize active defects in **GitHub Issues** using templates.

If you (human or AI) discover a defect, file an issue using the template below. Keep this document short; do not duplicate resolved issues.

## Status
Currently no confirmed open bugs tracked locally in this file. See GitHub Issues board for live list.

## Bug Report Template
Copy into a new GitHub Issue (label: `bug`).
```
Title: <short present-tense description>

Summary:
A concise explanation (1–2 sentences) of the incorrect behavior.

Environment:
  - Browser & version:
  - Device / viewport (mobile? desktop?):
  - Auth state (signed in? provider?):
  - Network conditions (optional):

Steps to Reproduce:
1. ...
2. ...
3. ...

Expected:
<What you thought should happen>

Actual:
<What actually happened>

Logs / Diagnostics:
  - Relevant console errors or warnings
  - Screenshot / GIF (if visual)
  - Any performance timings (if jank-related)

Suspected Root Cause (optional):
<e.g. scroll distance heuristic misfires before layout settle>

Proposed Next Actions:
  - [ ] Instrument X
  - [ ] Add failing test Y
  - [ ] Implement fix Z

Acceptance Criteria:
  - [ ] Deterministic reproduction no longer occurs
  - [ ] Related regression test passes
  - [ ] No new console errors introduced
```

## Fast Triage Checklist (Maintainers / AI)
Before fixing:
1. Confirm reproducibility twice (fresh session & incognito).
2. Check recent merges for related areas (git log / blame).
3. Add a minimal failing test if feasible (pref: RTL or hook test).
4. Capture metrics (scroll deltas, timings) if performance related.

## Categories & Suggested Labels
| Category | Label | Notes |
|----------|-------|-------|
| UI / Layout | `ui` | Visual misalignment, overlap, z-index |
| Accessibility | `a11y` | Focus order, ARIA issues, contrast |
| Performance | `perf` | Slow renders, jank, memory |
| Data Integrity | `data` | Missing / duplicate / inconsistent data |
| Security | `security` | Rules bypass, unauthorized access |
| Regression | `regression` | Broke after a known commit |

## Instrumentation Guidance
Add lightweight console groups behind a debug flag: `window.__DEBUG_SCROLL = true;` then gate logs.
Prefer structured logs: `console.log('[scroll]', { top, dist, height });`.

## Removal Policy
When a bug is fixed & test added, close the GitHub issue. Only add to this file again if systemic categories of issues need high-level tracking.

## Notes
This minimalist approach keeps attention on live, actionable issues rather than maintaining redundant documentation. Always favor a failing test over a long hypothesis section.
