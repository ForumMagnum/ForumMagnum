# AGENTS.md

## Scope And Default Assumptions

- This repo serves both the Effective Altruism Forum and LessWrong. Default
  to the **EA Forum** use case unless the task says otherwise.
- Most code lives under `packages/lesswrong`. That is legacy naming, not a
  sign that a file is LessWrong-only.
- Docs and comments can be stale. Trust current `package.json` scripts,
  `build.ts`, and `.github/workflows/*` over prose in old READMEs.

## EA Forum Branching And Deploys

- Branch off of `ea-staging` and target PRs at `ea-staging`. It is the
  integration branch for EA Forum work.
- **Do not touch `master`.** It is shared with LessWrong and is not in the
  EA Forum deploy path. Some old docs (including `README.md`) still tell you
  to — ignore them.
- `ea-deploy` is the production branch, updated by merging `ea-staging` into
  it. Do not push feature work there directly.
- Pushes to `ea-staging` trigger `Deploy EA Staging` and run staging
  migrations. Pushes to `ea-deploy` trigger `Deploy EA Prod`, upload the
  CkEditor bundle, and run production migrations.
- LessWrong deploys from its own branches (e.g. `lw-deploy`). Keep EA Forum
  and LessWrong deploy flows separate.

## What Is Unusual About This Codebase

- This is not a standard React app. It is a heavily customized descendant of
  Vulcan / Forum Magnum, with a lot of behavior split across schemas,
  GraphQL fragments, generated files, callbacks, and settings.
- Old terminology persists. You will see references to "collections",
  "documents", "Vulcan", and occasionally old Mongo-era concepts even though
  the app now uses Postgres and generated SQL schema artifacts.
- EA Forum behavior is usually **not** isolated in an EA-only directory. Most
  site-specific behavior is selected inside shared files with `isEAForum`,
  `forumTypeSetting`, or `forumSelect(...)`.
- The same feature often spans:
  collection schema,
  GraphQL fragments,
  generated types,
  React components,
  server callbacks,
  and database/public settings.

## Where To Look First

- `packages/lesswrong/lib/instanceSettings.ts`
  Forum type and instance-setting based behavior.
- `packages/lesswrong/lib/publicSettings.ts`
  Public database-backed settings sent to the client.
- `packages/lesswrong/server/databaseSettings.ts`
  Server-only database-backed settings and secrets.
- `packages/lesswrong/lib/forumTypeUtils.ts`
  `forumSelect(...)` helpers for site-specific branching.
- `packages/lesswrong/lib/routes.ts`
  Shared route definitions; a lot of EA-vs-LW behavior is routed here.
- `packages/lesswrong/lib/forumSpecificRoutes`
  Forum-gated route configs (`eaRoutes.ts`, `lwRoutes.ts`, `afRoutes.ts`,
  `index.ts`). Sibling to `lib/routes.ts` — check both when routing looks
  EA-specific.
- `packages/lesswrong/lib/betas.ts`
  Many feature flags differ by forum here.
- `packages/lesswrong/lib/collections`
  Collection schemas and permissions.
- `packages/lesswrong/server/vulcan-lib/mutators.ts`
  CRUD callback execution path.
- `packages/lesswrong/lib/utils/logging.ts`
  `loggerConstructor(scope)` for targeted debug logs, toggled by the
  `debuggers` public DB setting or `instanceDebuggers` instance setting.
- `packages/lesswrong/server/migrations`
  Idempotent DB migrations. See the Database Migrations section.
- `packages/lesswrong/lib/generated`
  Generated artifacts consumed by the app.
- `ckEditor`
  Separate editor bundle with its own lint/build flow.

## Settings Model

Three distinct settings systems — don't assume everything is an env var or a
JSON file:

- **Instance settings** (`PublicInstanceSetting` in `instanceSettings.ts`):
  loaded from the JSON passed via `--settings`.
- **Public database settings** (`DatabasePublicSetting` in
  `publicSettings.ts`): loaded from the DB and sent to the client.
- **Server database settings** (`DatabaseServerSetting` in
  `server/databaseSettings.ts`): loaded from the DB, server-only.

Implications:

- `forumType` is an instance setting, so a wrong settings file silently
  switches the app away from EA Forum behavior.
- Many modules read `isEAForum` / `forumTypeSetting.get()` at import time —
  starting with the wrong settings file means the behavior you see can be
  wrong even when the code is right.
- Server-side, instance settings may live under root, `private`, or `public`
  in the JSON. Client-side, only `public` is available.
- DB settings are lazy-loaded; accessing them too early can throw.
- If behavior looks inconsistent, verify the settings file and DB connection
  before editing application logic.

## Repository Layout

- `packages/lesswrong/components`
  React components. Many are registered by side effect.
- `packages/lesswrong/lib`
  Shared utilities, settings, routes, collections, schema helpers, site logic.
- `packages/lesswrong/server`
  Server code, SQL logic, migrations, codegen, callbacks.
- `packages/lesswrong/unitTests`
  Unit tests.
- `packages/lesswrong/integrationTests`
  Integration tests.
- `playwright`
  End-to-end tests.
- `packages/lesswrong/lib/generated`
  Generated component registry, fragments, schema-derived TS types.
- `schema`
  Checked-in SQL schema artifacts.

## Path And Build Conventions

- Use `yarn`, not `npm` or `pnpm`.
- Use Node `>=22.12.0` (see `package.json` `engines`).
- `@/` maps to `packages/lesswrong/*`.
- `@/allComponents` maps to
  `packages/lesswrong/lib/generated/allComponents.ts`.
- The dev/build entrypoint is `build.ts`, not Next.js or a standard Vite app.
- Database configs may automatically start an SSH tunnel based on the sibling
  credentials repo. Do not hand-roll a second connection path unless necessary.
- **`../ForumCredentials` is a hard prerequisite** for most `yarn ea-*`
  scripts, `yarn integration`, and `yarn migrate up [dev|staging|prod]` —
  they all read connection strings and settings from that sibling repo. A
  missing-file error pointing at `../ForumCredentials/…` means the repo
  needs to be cloned next to this one.

## EA Forum Local Development

- For most EA Forum work, prefer `yarn ea-start`.
  This uses `../ForumCredentials/settings-dev.json` plus the shared EA dev DB.
- Useful EA Forum variants:
  `yarn ea-start-staging-db`
  `yarn ea-start-prod-db`
  `yarn ea-start-testing-db`
- `yarn start-local-db` is for a local Postgres-backed setup and uses
  `settings-dev.json`. It is useful for isolated debugging, but it is not the
  default EA Forum workflow.
- The shared EA dev DB is stateful and used by multiple developers. Avoid
  risky or destructive manual changes there when a testing DB or branch DB will
  do.
- `yarn branchdb create|drop|list|clean` clones a per-branch copy of the dev
  DB. Use this when a task involves schema changes or destructive data edits
  so you don't disturb other devs on the shared DB.

### Running Scripts And Opening A Shell

- `yarn repl` / `yarn gfrepl` open a Node REPL with tsconfig-paths loaded;
  `gfrepl` uses EA dev settings. Prefer the REPL over writing throwaway
  scripts for one-off data inspection.
- `yarn ea-command-{dev,staging-db,prod-db,testing}` runs a one-off server
  command against the named DB with EA settings. Use this when you need the
  server boot path (callbacks, connections, settings) rather than raw SQL.
- `yarn ea-pg{,-staging,-testing,-prod,-dev-admin,-prod-admin}` drops you
  straight into `psql` against the matching DB. The `-admin` variants are
  elevated; be careful.
- `yarn shell-dev-db` / `yarn shell-prod-db` exist but use the LW credentials
  repo — use `ea-command-*` for EA Forum work.

## Database Migrations

- Migrations live in `packages/lesswrong/server/migrations` and **must be
  idempotent**. One-off operations that shouldn't re-run on replay belong in
  a server script (invoked via `yarn ea-command-*`), not a migration.
- After any schema change (tables, columns, indexes, Postgres functions)
  run `yarn generate` and commit the resulting diff under `schema/` and
  `packages/lesswrong/lib/generated/`.
- Commands:
  `yarn migrate create my_new_migration`,
  `yarn migrate up [dev|staging|prod]`,
  `yarn migrate down [dev|staging|prod]`,
  `yarn migrate pending [dev|staging|prod]`,
  `yarn migrate executed [dev|staging|prod]`.
  `dev|staging|prod` are resolved through `../ForumCredentials`. Without
  that repo, pass `PG_URL=...` instead.
- Down migrations are treated as optional and may not work.
- Staging and prod migrations run automatically via
  `.github/actions/runMigrations` on pushes to `ea-staging` and `ea-deploy`.
  Do not run prod migrations manually outside that flow.

## Generated Files And Codegen

- Do not hand-edit files under `packages/lesswrong/lib/generated` unless you
  are debugging codegen itself.
- `yarn generate` updates more than SQL schema. It also regenerates:
  `collectionTypeNames.ts`,
  `defaultFragments.ts`,
  `fragmentTypes.d.ts`,
  `databaseTypes.d.ts`,
  `viewTypes.ts`,
  `allComponents.ts`,
  `nonRegisteredComponents.ts`,
  and `gqlSchemaAndFragments.gql`.
- `allComponents.ts` is generated by scanning component files and importing
  them for side effects. Component registration is not a conventional manual
  index file.
- If you add schema fields, collection types, or components, expect codegen to
  be involved.
- After editing a GraphQL fragment, collection schema, or resolver `typeDefs`,
  run `yarn generate test && yarn tsc --noEmit` before assuming the change
  typechecks — the `fragmentTypes.d.ts` / `gqlSchemaAndFragments.gql`
  artifacts are what downstream `tsc` reads.
- `yarn generate` takes an env argument (`dev`, `staging`, `prod`, `test`) and
  needs that DB reachable. CI runs `yarn generate test`.
- Two SQL schema artifacts live under `schema/`:
  - `accepted_schema.sql` is checked in and is the source of truth for local
    DB init, CI, and Playwright fixtures. Commit this after intentional
    schema changes.
  - `schema_to_accept.sql` is produced by tests when the live schema drifts
    from accepted. Review it, then promote to accepted if the drift is
    intentional.

## Schema / GraphQL / UI Coupling

- A single field change often requires updates in several places:
  collection schema,
  GraphQL fragments,
  generated types,
  permissions,
  views/resolvers,
  and UI consumers.
- GraphQL fragments are especially important here. Forgetting to update a
  fragment is a common way to break a page after adding a field.
- Some server SQL logic is generated from fragment definitions, so fragments are
  not just a frontend concern.
- Smart Forms are driven by schema metadata. Before changing a form component,
  inspect the relevant collection schema and the field `control` settings.
- Rich text / revision-backed fields often go through `makeEditable`.
- Adding a field to the `Revisions` schema also requires adding it to the
  two `Omit<DbRevision, ...>` unions in
  [make_editable_callbacks.ts](packages/lesswrong/server/editor/make_editable_callbacks.ts)
  (one for new-document creation, one for edits). Missing this produces a
  non-obvious `tsc` error far from the schema change.
- `Posts.contents` uses `getNormalizedEditableResolver` (SQL-joins to the
  `Revisions` table), while `Comments.contents` uses
  `getDenormalizedEditableResolver` (builds a Revision-shaped object from the
  JSONB `contents` column on the Comment, which does **not** mirror every
  `Revisions` column). A new column added to `Revisions` surfaces on
  `Post.contents` but returns `null` on `Comment.contents` by default.

## Component And Styling Model

- Many components are declared with `registerComponent(...)`, and some files
  matter purely for side effects because the generated component registry
  imports them.
- Styling uses **JSS via `react-jss`**, typically through a `useStyles` hook.
  Site-specific visual behavior often lives in shared theme files rather
  than EA-only directories.
- Color literals in JSS styles (hex, rgb, color words) will fail
  `themePalette.tests.ts` unless the component opts out with
  `allowNonThemeColors`. Add new colors to `theme.palette` in
  [themeType.ts](packages/lesswrong/themes/themeType.ts),
  [defaultPalette.ts](packages/lesswrong/themes/defaultPalette.ts), and
  [darkMode.ts](packages/lesswrong/themes/userThemes/darkMode.ts) instead,
  so dark mode stays consistent. See the header comment in
  `defaultPalette.ts` for the full convention.
- Legacy **Material-UI is being actively removed** (see
  `cleanup-material-ui.js`, `knip-material-ui.json`,
  `remove_unused_material_ui.sh`). Do not introduce new `@material-ui/*`
  imports; prefer existing in-repo primitives or plain JSS.
- For targeted debug logging, use `loggerConstructor(scope)` from
  `lib/utils/logging.ts`. Toggle it at runtime via the `debuggers` public DB
  setting or the `instanceDebuggers` instance setting.

## Patterns That Commonly Surprise Agents

- EA Forum-specific behavior is scattered across shared files. Search for
  `isEAForum`, `forumTypeSetting`, and `forumSelect(` before concluding that a
  feature has no EA-specific path.
- Many old file and symbol names still say LessWrong even when the code is used
  heavily by EA Forum.
- A lot of business logic runs in collection callbacks around mutations, not in
  the React component that triggers the action.
- The right fix is often in a schema or callback file, not the visible UI file.
- The app has both test-only and forum-specific branching. Confirm whether a
  condition is keyed on `isAnyTest`, `isE2E`, `isEAForum`, or a public/database
  setting before simplifying it.
- `useMulti` emits queries named `multi${typeName}Query` (e.g.
  `multiPostsQuery`, `multiCommentsQuery`) — not the component or fragment
  name. Apollo's `refetchQueries` expects those operation names; passing
  component names fails silently.

## Testing Guidance

Each test command has its own prerequisites:

- `yarn lint` — root ESLint + TSC + CkEditor lint + CkEditor TSC. `yarn eslint`
  and `yarn tsc` only cover the main app.
- `yarn unit` — no DB required.
- `yarn integration` — needs `../ForumCredentials/testing-pg-conn.txt` and a
  seeded integration DB. Run `yarn create-integration-db` first (re-run after
  schema changes).
- `yarn playwright-test` — one-time setup: install Docker, run
  `yarn playwright-db` (pulls `ankane/pgvector` and starts it on `:5433` with
  fixtures), then `yarn playwright install` for browsers. The harness starts
  `yarn start-playwright` for you; if that's flaky, remove the `webservers`
  section from `playwright.config.ts` and run both manually.
- `yarn playwright-test-crosspost` — same as above plus
  `yarn playwright-db-crosspost` (second DB on `:5434`).

Guidance on what to run:

- For narrow changes, start with the smallest relevant check.
- For risky shared changes, run `yarn lint` plus the most relevant suite.
- For schema changes, run `yarn generate` and the relevant DB-backed tests.

Important CI quirk: after codegen for EA Forum, CI `sed`s
`"forumType": "EAForum"` → `"LessWrong"` in `settings-test.json` and runs
codegen again to check schemas stay in sync. If only one forum's schema
changed, CI fails with `LessWrong/EA Forum database schemas differ`. The fix
is to make the schema change forum-agnostic even if runtime behavior is
gated by `isEAForum` / `forumSelect(...)`.

Useful env vars:

- `SLOW_QUERY_REPORT_CUTOFF_MS` — set to `-1` against the remote dev DB to
  silence false-positive slow-query warnings.
- `FM_WATCH` — `true`/`false` to override the build's `--watch` flag.
- `PG_URL` — manual DB override for `yarn migrate`, `yarn integration`, etc.
- `SETTINGS_FILE` — settings file for the REPL and bootstrap flows.

## Consistency With Neighbors

Before editing a query, callback, or guard for a new field or state,
check parallel cases:

- How are analogous fields handled in the same function? E.g. when
  adding a `rejected` filter, see how `draft` and `deleted` are
  handled in the same query. Match the existing treatment.
- Does the sibling Posts/Comments callback do the same thing?
  Asymmetries are usually drift, not intent.
- Is the views system already enforcing this? Many queries take a
  filter the caller builds from `getDefaultViewSelector(...)`, which
  compiles to SQL — don't hand-roll a backstop for what it covers.

Treat reviewer suggestions (linter, AI reviewer, "this looks like an
anti-pattern") as questions, not directives — verify the rule applies
in this codebase's convention before acting.

## Practical Agent Workflow

- Before changing code, identify the relevant collection, fragment, settings
  source, and whether the behavior is forum-gated. For EA Forum-specific
  tasks, search shared files first before creating new EA-only files.
- When touching schema or generated artifacts, review the diff in
  `packages/lesswrong/lib/generated/` and `schema/` carefully.
- When a README or comment conflicts with current EA Forum deployment
  practice, trust the workflows and scripts.

When EA Forum behavior looks wrong, work through this checklist before
editing application code:

1. Which settings file is the running process using? (`--settings` flag or
   `SETTINGS_FILE` env var.)
2. Is `forumType` actually `EAForum` in that file?
3. Does the code path gate on `isEAForum`, `forumTypeSetting.get()`, or
   `forumSelect(...)`? Search before assuming a field is unconditional.
4. Is the relevant GraphQL fragment fetching the field? A missing fragment
   field is the most common cause of "data is there server-side but
   undefined client-side."
5. If DB-driven, is the fact a public vs server DB setting, and is the DB
   connection what you expect?

## CkEditor Build And Deploy

- The `ckEditor/` package has its own build, lint, and TSC; `yarn lint`
  covers both the main app and the CkEditor bundle.
- After touching code under `ckEditor/`, run `yarn rebuild-ckeditor` to
  rebuild locally. If the task touches editor toolbars, plugins, uploads, or
  collaboration, inspect both the app code and `ckEditor/`.
- The production bundle uploads automatically on push to `ea-deploy` via
  `.github/actions/uploadCkEditorBundle`. No manual step needed.

## PR Review Expectations

- Every PR gets a random reviewer from `@ForumMagnum/cea-developers` via
  `.github/CODEOWNERS`. Write PR descriptions assuming a reviewer who
  doesn't have the context of the task as given.
