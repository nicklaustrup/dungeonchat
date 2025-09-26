# Contributing to SuperChat

Welcome! This project is intentionally structured for **incremental, test-backed contributions** by both humans and AI agents. Please read this guide before opening a PR.

## Core Principles
- Thin vertical slices (data model + UI + security rules + tests + docs) over broad partial implementations.
- Every new write path or rule change should have at least one emulator-backed test (planned automation; stub test acceptable initially with TODO).
- Keep the backlog authoritative: remove features from `FUTURE_FEATURES.md` immediately after they are shipped and verified.
- Prefer explicit instrumentation (simple metrics/events) when adding new interaction surfaces.

## Getting Started
1. Fork & clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a branch:
   ```bash
   git checkout -b feat/<short-name>
   ```
4. Pick an issue (or open one) before starting significant work.

## Picking Work
Consult `FUTURE_FEATURES.md` for structured backlog items. Each feature should follow the Spec Template included there. If the feature doesn't exist yet:
1. Open a **Feature Request** issue using the template.
2. Add a draft spec (Goal, Data Model, Rules, Acceptance Criteria).
3. Wait for (or self-provide) a quick review comment acknowledging scope.

## Development Flow
| Step | Action | Notes |
|------|--------|-------|
| 1 | Create / update issue | Link planned branch |
| 2 | Write or adapt tests first | Unit + integration preferred |
| 3 | Implement feature | Keep commits scoped & descriptive |
| 4 | Add/adjust security rules | Co-locate rationale in PR description |
| 5 | Update docs | `README.md` (if surfaced) + remove from backlog |
| 6 | Run lint & tests | `npm run lint && npm test` |
| 7 | Open PR | Follow template; link issue |
| 8 | Address review feedback | Squash if necessary |

## Commit Messages
Format: `type: short imperative description`
Types: `feat | fix | docs | refactor | perf | test | chore`
Examples:
```
feat: add message soft delete with audit trail
fix: correct auto-scroll proximity threshold logic
```

## Code Style & Linting
- ESLint + Prettier are enforced (CI will fail on warnings configured as errors if specified).
- Avoid premature abstraction—optimize for clarity over DRY in early iterations.

## Testing Guidelines
| Level | Tool | Examples |
|-------|------|----------|
| Unit | Jest | Formatting utilities, reaction logic |
| Integration | React Testing Library | Send→render, edit→propagate |
| Accessibility (planned) | jest-axe | Role & name checks |
| Visual (planned) | Playwright/Chromatic | Core message variants |
| E2E (future) | Playwright | Auth → DM → pagination |

Prefer deterministic tests; mock Firebase where needed but prefer emulator-based tests for rules once harness is added.

## Security Rules
When modifying Firestore/RTDB rules:
- Document invariants in the PR (e.g., "authorId immutable after create").
- Provide at least one negative test (denied case) if feasible.

## Performance Considerations
- Measure before adding heavy dependencies.
- Defer large UI (emoji picker, modals) via dynamic import where possible.
- Keep message list performant (virtualization planned—avoid O(n) layout thrash operations in loops).

## Accessibility
- Ensure interactive elements are keyboard reachable.
- Use `aria-live` regions only when necessary (avoid noise).
- Maintain visible focus state (`:focus-visible`).

## Documentation Updates
- Update `FUTURE_FEATURES.md` (remove or adjust) after merge.
- Add any new environment variables to `.env.example` with comments.
- If a new developer-facing script is added, mention it in README.

## AI Agent Guidance
If you are an automated contributor:
1. Validate the current backlog—avoid duplicating an implemented feature.
2. Use small, auditable commits.
3. Always run tests locally (or simulate) before opening PR.
4. Prefer adding missing tests over introducing untested functionality.

## License
By contributing you agree your work is provided under the project MIT License (see `LICENSE`).

## Questions / Help
Open a **Discussion** or an issue labeled `question`. Provide reproduction steps or links to code lines when possible.

Happy building! 🛠️
