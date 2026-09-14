# Contributing to Pantry List

Thanks for taking a look. This project is intentionally small in scope — see the [MVP scope and roadmap](README.md#mvp-scope-and-roadmap) in the README before proposing a large new feature, and consider opening an issue to discuss it first.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- An Android emulator (via [Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/)) or a physical device with [Expo Go](https://expo.dev/go)
- macOS + Xcode if you want to test iOS locally; otherwise see the README's [iOS from Windows](README.md#ios-from-windows) section

## Setup

```bash
git clone <your fork>
cd note-list-mobile-app
npm install
npm run android   # or: npm run ios / npm run web
```

The app runs its Drizzle migrations and creates its SQLite database automatically on first launch — there's no separate setup step. Use **Settings → Seed sample data (dev only)** to populate the Library with realistic content instead of starting empty.

## Branch and PR expectations

- Branch off `main`; give the branch a short, descriptive name (`fix/label-filter-stale`, `feat/list-item-drag`).
- Keep PRs scoped to one change. Large, unrelated changes bundled into one PR are hard to review and hard to revert if something's wrong.
- Write a PR description that explains _why_, not just _what_ — link the issue it addresses if there is one.
- Before opening a PR, run the full local check suite (below) and make sure it's clean. CI runs the same checks and will fail on the same things.
- Be prepared to discuss trade-offs. This is a small, opinionated codebase (see the architecture rules below) — a PR that works but doesn't fit the existing patterns will likely get review comments asking for changes, not an outright rejection.

## Before you open a PR

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

All four must pass. `npm run format` will fix most formatting issues automatically; `npm run lint` reports issues you'll need to fix by hand.

## Test requirements

- New logic (a repository/service function, a reducer, a pure utility) needs a unit test. Look at `tests/` for the existing pattern before adding a new one — in particular, anything that touches the real database should go through the shared in-memory `better-sqlite3` test-db helper (`tests/helpers/test-db.ts`), not a mock. `expo-sqlite` has no Jest mock and cannot run outside a real device/emulator; repository and service functions accept an injectable `executor` parameter specifically so tests can substitute the in-memory database.
- New UI behavior (a new screen, a new interactive component) should get a component test where practical, using React Native Testing Library. See `tests/accessibility.test.tsx` for the icon-only-control-label pattern and `tests/library-filter-sort-dialog.test.tsx` for a dialog-driven interaction.
- If you're fixing a bug, add a test that would have caught it, where that's feasible.
- A PR that only touches UI copy or non-logic markup doesn't need a new test, but shouldn't break existing ones.

## Style and accessibility expectations

- **TypeScript strict mode** is on project-wide. Don't work around type errors with `any` or `@ts-ignore` — fix the underlying type issue, or ask in the PR if you're genuinely stuck.
- **No raw SQL/Drizzle queries in UI components.** Screens and components call feature hooks (`useListDetail`, `useLibraryEntries`, ...) or service/repository functions from `src/features/<area>/`. If you're writing a `db.select(...)` inside a `.tsx` file outside `src/features/`, it belongs in a repository function instead.
- **Repository vs. service:** a repository function holds one raw query. A service function wraps a multi-step, transactional operation (e.g. creating a list along with its initial sublists and items) in `db.transaction(...)`. Keep that split when adding new domain logic.
- **Every icon-only control needs an accessible label** (`accessibilityLabel` on the `Pressable`/`Button`, not just a visual icon). Run a screen reader (TalkBack on Android, VoiceOver on iOS) over anything you add that isn't a plain text button.
- **Checkbox and toggle state must be announced correctly** — if you add a new checkable control, verify its accessibility state (`checked`/`unchecked`) with a component test, not just visual inspection (see `tests/accessibility.test.tsx`).
- **Don't communicate meaning through color alone**, and keep text/border contrast sufficient against the app's dark theme (`src/theme/theme.ts`).
- **Respect dynamic type and reduced motion.** Avoid fixed-height containers around text that could clip at larger system font sizes — use `min-h-*`, not `h-*`, for anything holding a text label (see `src/components/ui/button.tsx`'s comment on this). Any new animation should honor the OS's reduced-motion setting the way `src/components/ui/dialog.tsx` does (`ReduceMotion.System`).
- Run `npm run format` before committing; don't hand-fight Prettier's output.

## Migration workflow

The schema lives in `src/db/schema.ts`. To change it:

1. Edit `schema.ts`.
2. Run `npx drizzle-kit generate` — this writes a new folder under `src/db/migrations/` and updates `migrations.js`.
3. Commit the generated migration files alongside your schema change. Don't hand-edit generated migration SQL.
4. Test it: on a device/emulator, force-reinstall the app (or clear its data) so the migration runs from an empty database, and confirm the app boots past the `useMigrations()` gate in `src/app/_layout.tsx` without error. If you're changing an existing table (not just adding one), also test against a database that already has the _old_ schema and seed data, to make sure the migration doesn't drop or corrupt existing rows.
5. If your change affects anything the test-db helper relies on (`tests/helpers/test-db.ts` applies every migration file in order to build its in-memory database), run `npm test` to confirm nothing broke.

`drizzle-orm`, `drizzle-kit`, and `expo-sqlite` are deliberately pinned to specific RC/prerelease versions — see the README's [note on RC-pinned versions](README.md#tech-stack) before changing them.
