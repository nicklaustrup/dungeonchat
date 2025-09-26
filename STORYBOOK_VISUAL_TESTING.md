## Visual Regression Testing with Storybook & Chromatic

This project now includes a Storybook setup focused on the `ChatMessage` component states. These stories let you capture and review visual snapshots (locally or via Chromatic) for regression detection.

### Installed Pieces
Dev dependencies (add via `npm install` after pulling):
- `@storybook/react`, `@storybook/addon-essentials`, `@storybook/addon-interactions`, `@storybook/addon-a11y`
- `@storybook/testing-library` (for future interaction tests)
- `chromatic` (CI visual regression service)

### Scripts
Run Storybook locally:
```bash
npm run storybook
```
Build static bundle:
```bash
npm run build-storybook
```
Publish to Chromatic (requires project token env var):
```bash
CHROMATIC_PROJECT_TOKEN=your_token_here npm run chromatic
```

### Adding More States
Add additional stories in `src/stories/ChatMessage.stories.jsx` – aim for one story per distinct visual state (error, loading placeholder, long text wrapping, etc.).

### Mocking Strategy
The stories mock:
- Firebase context (`FirebaseProviderMock`)
- Presence context (`PresenceProviderMock`)
- Reactions hook (`useReactions`) in-story via `jest.mock`

This isolates visual rendering without network or Firestore writes.

### Recommended Next Enhancements
1. Add a `MessageList` story with virtualized scrolling.
2. Introduce accessibility audit gating in CI (`@storybook/addon-a11y`).
3. Add interaction stories (toggle reactions, open menu) using `play` functions and enable Chromatic interaction tests.

### CI Integration (Example GitHub Action Snippet)
```yaml
name: Visual Tests
on: [push, pull_request]
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### Notes
React 19 compatibility is evolving; if Storybook issues arise, pin a compatible prerelease or downgrade React temporarily for visual test environment only.

---
Maintainer: visual regression layer initial scaffold.