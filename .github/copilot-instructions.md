## For AI coding agents: quick orientation

Below are the specific, discoverable details an automated coding agent needs to make safe, useful edits quickly.

- Architecture Key locations:
  - Data schemas: `docs/schemas/` (directory of JSON schemas)
  - Component registry: `docs/component-registry.md`
  - Dependency map: `docs/dependency-map.json`
  - Firestore rules: `firestore.rules`
  - Firebase config & initialization: `src/services/firebase.js`
  - Cloud Functions: `functions/` and `functions/README.md`

- Project-specific conventions to follow when editing:
  - Branch naming: `feat:<name>` or `fix:<name>`.
  - Commit message format: `<type>: short description` where `type ∈ { feat | fix | docs | refactor | perf | test | chore }`.
  - Use `TODO.md` for tracking planned work and completed features

If anything here is unclear or you want more examples (e.g., a PR template for automated fixes), say which part to expand and I will iterate.
