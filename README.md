# Pantry List

An open-source, local-first mobile app for reusable hierarchical lists and labeled rich-text notes — built with Expo and React Native.

The core use case is a recurring grocery list: create it once, check items off while shopping, then clear the checked state (all at once, or sublist by sublist) and reuse the exact same list next time. No accounts, no cloud, no template gimmicks — just a fast, structured list and note tool that keeps working with no network connection.

## Features

- **Hierarchical lists** — root-level items plus named sublists (e.g. a "Grocery List" with "Dairy", "Produce", "Meats" sections), each holding checkbox or plain-text items.
- **Reuse, not templates** — check items off, then bulk-uncheck the whole list or a single sublist to reset it for next time. A confirmation guards any bulk action affecting more than 10 items.
- **Reorder** — move items and sublists up/down within their parent container.
- **Rich-text notes** — bold, italic, underline, headings (H1–H6), bullet lists, and numbered lists, with multiple labels per note.
- **Library** — a single searchable, filterable, sortable view across every list and note. Search matches list titles, sublist titles, list-item text, note titles, and note labels, with a contextual match preview (e.g. "Dairy · Milk") for nested hits.
- **Labels** — create, rename, and delete labels (case-insensitive unique names); filter the Library by label.
- **Local-first** — every read and write goes straight to an on-device SQLite database. The app is fully usable in airplane mode.
- **Dark-first UI**, built for accessibility: labeled icon-only controls, announced checkbox state, respects the OS's reduced-motion and dynamic-type settings, and gives selective haptic feedback on checkbox toggles and destructive confirmations.
- **Performant at scale** — Library and the list detail screen are both backed by [`@shopify/flash-list`](https://shopify.github.io/flash-list/), verified responsive with several hundred lists/notes and several thousand list items.

## Tech stack

| Layer         | Choice                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | [Expo](https://expo.dev) (SDK 57), React Native 0.86, React 19, New Architecture                                                                              |
| Language      | TypeScript, `strict: true`                                                                                                                                    |
| Navigation    | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, in `src/app/`)                                                                         |
| Persistence   | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team/) (schema, migrations, reactive `useLiveQuery`)     |
| Styling       | [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS for React Native)                                                                                  |
| UI primitives | [React Native Reusables](https://reactnativereusables.com/) (shadcn-style components on top of [`@rn-primitives`](https://github.com/roninoss/rn-primitives)) |
| Icons         | [Lucide React Native](https://lucide.dev/)                                                                                                                    |
| Rich text     | [`@10play/tentap-editor`](https://github.com/10play/10tap-editor) (WebView-backed, ProseMirror under the hood)                                                |
| Sanitization  | [`sanitize-html`](https://www.npmjs.com/package/sanitize-html) (pure JS, verified Hermes-compatible)                                                          |
| Lists         | [`@shopify/flash-list`](https://shopify.github.io/flash-list/) v2                                                                                             |
| Testing       | Jest (`jest-expo` preset) + React Native Testing Library                                                                                                      |

> **A note on RC-pinned versions:** `drizzle-orm` and `drizzle-kit` are deliberately pinned to their current release-candidate line (`^1.0.0-rc.4` in `package.json`), and `expo-sqlite` was installed via `expo install expo-sqlite@next` rather than the default stable tag. This isn't an oversight — it's the only documented, working combination that gives Drizzle reactive queries (`useLiveQuery`) against Expo SQLite today. Don't "fix" these to older stable versions without confirming `useLiveQuery` still works; do feel free to bump them forward as newer RCs or stable releases ship, re-testing reactivity (Library and list-detail screens updating live as you check items off) before merging.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- An Android emulator (via [Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/)) and/or a physical device with [Expo Go](https://expo.dev/go), for day-to-day development
- Xcode + an iOS Simulator if developing on macOS (see [iOS from Windows](#ios-from-windows) below if you aren't)

### Install and run

```bash
npm install
npm run android   # or: npm run ios / npm run web
```

This starts the Metro bundler and opens the app in an emulator/simulator (or scan the QR code with Expo Go on a physical device). On first launch the app runs its Drizzle migrations automatically and creates the on-device SQLite database — there's nothing else to configure.

To try the app with realistic content instead of an empty Library, go to **Settings → Seed sample data (dev only)** once the app is running. This button (and a second one that seeds several hundred entries / several thousand list items, for performance testing) only renders in development builds (`__DEV__`).

### Other scripts

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npm run format        # prettier --write .
npm run format:check  # prettier --check .
npm test              # jest
npm run test:watch    # jest --watch
```

## Building for Android and iOS

Local development (`npm run android` / `npm run ios`) uses Expo Go or a dev client and doesn't produce an installable release build. To build a real APK/AAB or IPA, use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build:configure    # first time only - generates eas.json
eas build --platform android
eas build --platform ios
```

Before your first build, set `expo.android.package` and `expo.ios.bundleIdentifier` in `app.json` (reverse-DNS identifiers, e.g. `com.yourname.pantrylist`) — these aren't set in this template and EAS will ask for them if missing.

### iOS from Windows

Local iOS builds and the iOS Simulator both require macOS, so if you're developing on Windows you can't run `npm run ios` or build a `.ipa` locally. EAS Build solves this: `eas build --platform ios` compiles your iOS build on Expo's own macOS infrastructure, no Mac required. You'll need:

- An [Apple Developer Program](https://developer.apple.com/programs/) membership (for device/TestFlight builds — EAS can manage your certificates and provisioning profiles for you if you let it)
- An [Expo](https://expo.dev) account (`eas login`)

Once the build finishes, submit it to TestFlight with:

```bash
eas submit --platform ios
```

and install it via the TestFlight app on any iPhone/iPad enrolled as a tester — again, no Mac needed at any point in this flow.

## Database and migrations

The schema lives in [`src/db/schema.ts`](src/db/schema.ts) (Drizzle table definitions for `entries`, `lists`, `sublists`, `list_items`, `notes`, `labels`, and `entry_labels`). [`src/db/client.ts`](src/db/client.ts) opens the SQLite database (`pantry-list.db`, WAL mode, foreign keys enforced) and wraps it with Drizzle.

Whenever you change `schema.ts`, generate a new migration:

```bash
npx drizzle-kit generate
```

This writes a new folder under `src/db/migrations/` plus an updated `migrations.js` barrel file. Migrations run automatically on app startup via a `useMigrations()` hook in [`src/app/_layout.tsx`](src/app/_layout.tsx) — the app renders nothing until they've completed, and shows a plain error screen if they fail. There's no separate "run migrations" step for end users; committing the generated migration files is enough.

IDs are client-generated UUIDs (`src/lib/id.ts`), not database-assigned autoincrement values — this is deliberate (see `schema.ts`'s header comment: `expo-crypto` can't be imported directly into the schema file without breaking `drizzle-kit generate`'s bundler).

## Testing

```bash
npm test
```

Unit and component tests run under Jest with the `jest-expo` preset and React Native Testing Library. Anything touching the real SQLite database uses an in-memory `better-sqlite3` instance seeded from the same generated migrations (see `tests/helpers/test-db.ts`) rather than a mock — `expo-sqlite` itself has no Jest mock and can't run outside a real device/emulator, so repository and service functions accept an injectable `executor` parameter specifically so tests can substitute the in-memory database for the real one.

## Architecture overview

```text
src/
├── app/                 # Expo Router routes (file-based navigation)
│   ├── (tabs)/           # Library and Settings tabs
│   ├── lists/            # List creation and detail/edit
│   └── notes/            # Note creation, detail, and edit
├── components/
│   ├── ui/               # React Native Reusables primitives (Button, Dialog, Checkbox, ...)
│   ├── library/           # Library screen's own components
│   ├── lists/             # List detail screen's own components
│   └── notes/             # Note editor and label picker
├── db/
│   ├── schema.ts          # Drizzle table definitions
│   ├── client.ts          # openDatabaseSync + drizzle() + pragmas
│   ├── migrations/        # drizzle-kit generate output (checked in)
│   └── seed.ts, seed-perf.ts  # dev-only seed data
├── features/               # Domain logic, one folder per area (lists/notes/labels/library)
│   └── <area>/
│       ├── <area>.repository.ts   # Raw Drizzle queries
│       ├── <area>.service.ts      # Transaction-wrapped, cross-table operations
│       └── <area>.hooks.ts        # Reactive useLiveQuery-based hooks for the UI
├── lib/                   # Cross-cutting utilities (HTML sanitization, ids, haptics, errors, ...)
├── theme/                 # Dark-mode design tokens
└── constants/
```

Data flows in one direction: **UI components call feature hooks/services, never raw SQL directly.** Repositories hold plain Drizzle queries; services wrap multi-step, transactional operations (e.g. creating a list with its initial sublists and items in one atomic write); hooks adapt either into `useLiveQuery`-backed reactive state so the UI re-renders automatically when the underlying data changes — no manual refresh, no separate client-side state store duplicating what's already in SQLite.

Both Library and the list detail screen render through `FlashList`, flattening whatever hierarchical data they're showing (root items, sublist headers, sublist items) into a single typed row array so the list stays virtualized end to end, rather than nesting a smaller list inside a larger scrollable container.

## MVP scope and roadmap

This is a deliberately minimal MVP, built around one product principle above all: reuse the same saved list, don't template it. Explicitly **out of scope** for now:

- Accounts, authentication, or any cloud sync
- Real-time collaboration or sharing
- Reminders, notifications, or scheduling
- Inventory tracking or barcode scanning
- "Create a list from a template" — lists are reused directly, not instantiated from templates

Candidate future directions, roughly in order of likely value: drag-and-drop reordering (the MVP uses explicit move-up/move-down actions instead, to avoid taking on a cross-platform DnD dependency this early); an import/export mechanism (JSON, or plain text for lists); light-mode theming (the MVP is dark-only); iOS-specific manual QA and a signed release build (the Android side of the manual acceptance checklist is complete; iOS testing still needs a maintainer with an Apple Developer account to carry out).

## Privacy

Pantry List collects no data and makes no network requests of its own. Every list, note, and label lives entirely in a local SQLite database on your device. There are no accounts, no analytics, no crash reporting, and nothing is ever synced or uploaded anywhere. Uninstalling the app deletes all of its data.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branch/PR expectations, and how to add and test a migration.

## License

[MIT](LICENSE)
