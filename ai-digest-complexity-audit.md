# PR #12691 ("Content for You"): complexity and correctness audit

Date: 2026-09-22
PR: https://github.com/ForumMagnum/ForumMagnum/pull/12691

Candidate audited: `/tmp/ai-digest-wave1` (branch `codex/ai-digest-wave1`). That is PR head `870359821a` plus the uncommitted changes from the earlier simplification passes. Diffs are measured against the merge base `8f37d21e54`.

## How this audit was done

- I read all handwritten implementation in the candidate: pipeline, SQL, renderers, pages, resolvers, scheduling and Mailgun. I also read the earlier plans and results, and compared the code with facilities that already exist in the repo.
- I recreated the candidate byte-for-byte in an isolated worktree and reproduced the earlier test run: 137 unit tests in 14 suites pass. Typecheck shows 18 errors, all environmental (missing hocuspocus packages, ungenerated `.next` route types). None are in digest code.
- I made no changes to the candidate or the main checkout.
- Four prototype agents were started on scratch copies and stopped before finishing. The two partial data points below are unverified. **All savings figures in this document are estimates.**

## Bottom line

- Behavior-preserving restructuring could plausibly remove about **700–1,200 implementation lines (6–10%)**. The earlier passes removed 476.
- A 50% reduction is only reachable by cutting features: discussion threads, the workbench, click attribution, cleaned previews. That is a product decision, not simplification.
- Four release-relevant problems (findings 1–4) matter more than line count.

## 1. Diff accounting

Candidate vs. merge base (working tree plus untracked files):

| Category | Files | Added | Deleted |
|---|---:|---:|---:|
| Handwritten implementation (feature) | 70 | 12,058 | 23 |
| Handwritten implementation (adjacent/unrelated edits) | 10 | 156 | 47 |
| Tests | 16 | 3,501 | 0 |
| Generated (mostly reordering in `gql-codegen/graphql.ts`) | 11 | 4,026 | 2,759 |
| Docs (`SCALING.md`) | 1 | 176 | 0 |

- The original PR (merge base to `870359821a`) added 12,689 handwritten implementation lines. That is about 11.4k excluding blank and comment lines, which is where the "~10,000 lines" figure comes from. GitHub reports +19,957 in total.
- The earlier passes' "−476 implementation lines" checks out to within 3 lines of classification. That is **3.8%** of the PR's handwritten implementation.

Implementation by responsibility (candidate, added lines):

| Area | Lines |
|---|---:|
| Renderers: email 1,535, web 929, shared helpers/fragments 419 | 2,883 |
| Post-selection pipeline: orchestration 770, candidates/dossier 640, reader signals 472, prompt 409, search tools 407, SQL 549 | 3,247 |
| Reader page (946) and admin workbench (1,210) | 2,156 |
| Discussion threads: pipeline 972, SQL 308 | 1,280 |
| Summary/preview caches | 740 |
| Issue schema, collection, registration | 573 |
| Mailgun click tracking | 446 |
| History | 398 |
| Scheduling and delivery | 314 |
| Notifications, user fields, adjacent UI | 177 |

## 2. Findings

### Release-relevant

1. **On-demand generation will likely exceed the request time limit.**
   - Both the reader page (`GenerateContentForYouIssue`) and the workbench (`GenerateAiDigestEmailSamples`) run full generations inside `/graphql`. That route declares `maxDuration = 120` (`app/graphql/route.ts:22`).
   - The workbench runs up to three generations in parallel (`server/resolvers/digestEmailPreviewResolver.tsx:116`).
   - Code comments and UI copy describe generation as taking several minutes. The issue is saved only at the very end (`server/aiDigest/aiDigestPostSelection.ts:625`).
   - Failure scenario: a run with a cold summary cache (60 summaries generated eight at a time) plus the 8-step tool loop exceeds 120s. The function is killed, nothing is saved, the tokens are already spent, and the user sees a network error.
   - The earlier runtime notes recorded this as a release gate, but it is still open.

2. **Click tracking can store password-reset links (security; depends on how Mailgun is configured).**
   - A comment says digest click attribution depends on turning on Mailgun click tracking for the whole domain (`server/emails/sendEmail.ts:19`).
   - Mailgun can enable it per message instead: `o:tracking-clicks` overrides the domain setting ([Mailgun: Tracking Clicks](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/tracking-clicks)).
   - The webhook stores every `clicked` event, from every email type, with the raw URL (`app/api/mailgun/webhook/route.ts:44`, `server/mailgun/emailEventIngestion.ts:23,42`). It writes to `EmailEvents` and mirrors to analytics.
   - Failure scenario: with domain-wide tracking on, someone (or a link scanner) clicks a reset-password or verify-email link (`server/emails/emailTokens.ts`). The token-bearing URL is written to `EmailEvents` and the analytics database, where anyone with access can read a still-valid token.
   - Fix: send `o:tracking-clicks` with digest messages only; drop events whose `emailType` is not the digest's before storing; don't store query strings beyond `emailSrc` and `commentId`.

3. **The personalized thread prompt is sent to analytics on every generation (privacy).**
   - `server/aiDigest/aiDigestPostSelection.ts:671` sends `threadSelectionUserPrompt`. The PR's own commit `fdff6eefcc` moved it there.
   - It contains the reader's recent reads, upvote strength on posts and comments, see-less feedback text, followed authors and personal instructions.
   - It isn't shown in the workbench either, so it serves no admin workflow.
   - Fix: remove it from the event, or save it admin-only on the issue row like the post-selection prompt.

4. **The post pool doesn't match the window the model is told about (possible departure from intent).**
   - The pool is the 60 newest eligible posts with at least 20 karma (`server/repos/PostsRepo.ts:1524-1525`). The prompt describes it as a 14-day window with a 20-karma floor (`server/aiDigest/aiDigestPostSelectionPrompt.ts:315`).
   - `SCALING.md` reports all 60 slots filled in the 14-day dev sample, and the 28-day run produced the same 60 posts.
   - So the planned widening to 28 days (`server/aiDigest/aiDigestPostCandidates.ts:40`) would not change the post pool, and the model may assume that absent recent posts don't exist.
   - This is an algorithm decision, so it shouldn't be changed silently.

### Medium

5. **Admins can read other users' private signals through the workbench.**
   - Any admin can generate a digest for any user (the workbench has an "Include non-admins" option).
   - They can then read the saved `selectionUserPrompt`, which contains that user's reads, votes (with strength) and see-less text. It is kept on every issue indefinitely.
   - LessWrong treats votes as private, so this needs an explicit policy decision before wider use.

### Low

6. **The duration estimate is too low.** Generation time is recorded before validation, previews and saving (`server/aiDigest/aiDigestPostSelection.ts:594`), so the "Generations typically take…" copy understates.
7. **Parallel samples can lose previews.**
   - When two generations race to save the same post preview, the loser returns nothing and falls back to a plain-text excerpt (`server/aiDigest/aiDigestPostPreviews.ts:207`). This happens even though it computed a valid preview.
   - It's reachable when the workbench's three parallel samples pick the same post on a cold cache.
   - Summaries handle the same race by reading the winner's row, so the two caches behave inconsistently. Existing tests pin the current preview behavior.
8. **Retries can send stale issues.**
   - The scheduled retry sends the latest unsent scheduled issue however old it is (`server/aiDigest/aiDigestScheduledEmails.tsx:117`).
   - A recipient whose send keeps failing takes one of the two per-run slots every hour. This is a known open policy.
9. **The ready notification doesn't link to its issue.** It always goes to `/contentForYou` and ignores the issue ID (`lib/notificationTypes.tsx:737`), and the reader page can't deep-link to an issue.
10. **The two renderers treat old issues differently.** The web renderer drops a stored recommendations title from older issues (`components/aiDigest/AiDigestIssueView.tsx:833`); the email still renders it (`server/emailComponents/AiDigestEmail.tsx:1332`).
11. **The context-chain rule checks the wrong list.**
    - It checks the model's *requested* display comments, not the ones actually kept (`server/aiDigest/aiDigestThreadSelection.ts:153,234`). If the model mistakenly requests an ancestor as a display comment, a valid context chain is suppressed.
    - An existing test pins this behavior, so changing it is a behavior change.
    - If it were switched to the kept comments, those checks would become dead code, because kept display comments are always descendants of the anchor.

### Duplication, dead code and conventions

- **Byline rules exist twice:** in TypeScript (`aiDigestPostByline`, `server/aiDigest/aiDigestReaderSignals.ts:266`) and in SQL (`aiDigestPostAuthorExpression`, `server/repos/PostsRepo.ts:96`).
- **The workbench preview query duplicates the issue type.** `AiDigestEmailSamplePreview` (`server/resolvers/digestEmailPreviewResolver.tsx:82`) returns nine fields the `AiDigestIssue` collection type already exposes to admins. Only the rendered email is new.
- **A shared SQL helper was rewritten for one caller.** `getViewablePostsSelector` (`server/repos/helpers.ts:31`, 42 call sites) was converted into an `Object.entries` pipeline so it could share values with a new selector used in one place (the curated lookup).
- **Small duplicates:** the email-body factory exists in two places, and so does the code that creates the "digest ready" notification.
- **Checks that look redundant** (still to be confirmed):
  - Selection validation re-checks limits the output schema already enforces (`aiDigestPostSelection.ts:157,194`).
  - `deduplicateAuthorSubscriptions` runs on a list built from a `Set`.
  - History re-applies the `countsTowardHistory` filter its query already applied (`aiDigestHistory.ts:270`).
  - `clampSearchLimit` repeats the tool's input-schema bounds.
- **Abstractions with a single real use:**
  - The `nearestNeighborGroups` callback.
  - A wrapper object around the discovered-candidates map.
  - A generic thread-tree builder used with one type, plus a `{comment}` wrapper.
- **Fields carried but never read:** three of the dossier's four `windowDays`, and the negative-preference `documentId`/`postId`.
- **The custom scheduling lease** duplicates the existing `getLockOrAbort` advisory-lock utility. But `SCALING.md` documents a deliberate reason (no DB connection is held during LLM work). Recommend keeping it.
- **Unrelated changes bundled into the PR:**
  - Global `Menu.tsx` positioning.
  - The moderation `recordView` change.
  - The shared `EmailPreview` layout.
  - The email header `http-equiv` fix.
  - Dropdown and user-search props.
  - `SCALING.md`, which is benchmark narrative pointing at `/private/tmp` files.
- **AGENTS.md compliance is otherwise good.** The only casts are `as const`. A few inline helpers capture scope (`takeGroup`, `readablePostIds`), and the web view uses many non-palette `light-dark()` colors (allowed, but the guide prefers palette colors).

## 3. Architectural alternatives

### Behavior-preserving (ranked; all estimates)

| # | Change | What disappears | Est. lines |
|---|---|---|---:|
| 1 | Post pipeline representations | The dossier structure (used only to build the prompt, carries unused fields), the per-reader "annotation row" layer, search-tool indirection, the duplicate byline, redundant validation | 200–400 |
| 2 | Explicit issue format | The generic sections/items/placement structure becomes three explicit lists: recommendations, discussions, curated. The "placement", "section" and document-reference concepts leave both renderers | 100–250 |
| 3 | Discussion pipeline | Two layers of per-comment reader data merge into one; a single thread structure replaces several parallel maps | 80–150 |
| 4 | Admin surfaces | An admin-only `renderedEmail` field on the issue type replaces the custom preview query; duplicated email-body and notification code; leftovers | 100–150 |
| 5 | Revert the shared SQL helper | The `Object.entries` rewrite and the one-caller selector (mostly lowers risk in widely shared code) | 20–30 |
| 6 | Mechanical renderer cleanup | Repeated email table and style boilerplate; excerpt logic repeated four times. Shorter code, but no responsibility removed | 80–150 |

Unverified partial evidence from the stopped prototypes:

- The post-pipeline prototype was at about −459 lines.
- The explicit-issue-format prototype's email and web output matched the old renderers byte for byte on 400 generated issues. Its comparison harness had not yet been mutation-tested (checked that it would catch a difference).

Cost of #2: about 38 saved issues in the dev database (per `SCALING.md`) would need regenerating or a ~30-line compatibility shim. Production is assumed to have none because the PR is unmerged. That was not verified, because production reads were blocked.

### Product or algorithm changes (need approval; keep separate)

| Change | Est. lines | Trade-off |
|---|---:|---|
| Merge thread selection into the post-selection model call | 150–200, plus one fewer model call | Changes prompts, tool-loop behavior and how failures are isolated; needs a quality evaluation |
| Get the preview cut point from the summary call | ~250, plus one table | Changes the summary prompt and the model used for previews |
| Consolidate admin tooling | ~150 (remove the reader page's duplicate admin controls) to ~600 (fold the workbench into the reader page) | UX and workflow trade-off |
| Split click attribution and unrelated edits into separate PRs | ~1,300 fewer lines to review | Reduces review surface only, not total code |

## 4. What the earlier passes missed or overstated

- **Missed:** findings 1–5. The time-limit issue was recorded as a release gate but never resolved.
- **Some reductions are density rather than structure.**
  - `promptCandidateAnnotations` merges the post and quick-take branches using `"isRead" in` / `"postId" in` checks (`aiDigestPostSelectionPrompt.ts:172,182`). That weakens type separation: quick takes live on shortform posts, so a future `postId` field on quick takes would silently change their item ID.
  - Also: the in-place tuple mutation `existing[5] += 1`, and `cards.findLast(...)` kept only to mimic an earlier Map overwrite.
- **One claimed fix was a deduplication.** The "full subscription set" change only avoided repeated loads; the original code already used the full set for annotations.
- **The largest structural items were left untouched:** the dossier structure, the byline duplication, the generic issue format, the duplicate preview query and the shared-helper rewrite.
- **Leftovers:** a stray fragment wrapper (`DigestEmailPreviewPage.tsx:677`), `hasAccess`/`isAdmin` duplicates (`ContentForYouPage.tsx:456-457`), and unused `minKarma`/`publishedAfter` parameters in `getNearestPostIdsWeightedByQualityByPostId`.
- **Checked and sound:**
  - The correctness fixes: connected comment budgets, including shortform threads, filtering search results before the nearest-neighbor limit, a history reset that keeps cadence and clicks, correct query projections, revision-keyed caches, sanitized error reports, and a single workbench attempt per sample.
  - The test and accounting claims.

## 5. Recommended plan

1. **Decide the release blockers:**
   - Move on-demand generation out of the request; the UI already promises "you will be notified".
   - Turn click tracking on per message only, and ignore non-digest clicks.
   - Stop sending the thread prompt to analytics.
   - Resolve the pool-window question.
   - Set a policy for admin access to other users' prompts.
2. **Land the small correctness patches separately:** the duration measurement, and optionally the preview race and the notification deep link.
3. **Do the behavior-preserving work in the order of section 3.** Verification for each step:
   - Byte-identical system, shared and personalized prompts and tool payloads on seeded fixtures.
   - Identical exclusion and selectability decisions, and identical saved ID columns (`postIds`, `quickTakeIds`, `discussionCommentIds`).
   - Identical final inlined email HTML and web markup for the same content.
   - Real-Postgres integration tests for any SQL change.
   - No new typecheck errors.
   - Delete tests only when they encode removed internals, and say what behavioral coverage replaces them.
4. **Send the product and algorithm proposals for a separate decision.**

## 6. Limits

- I read all implementation files but not every test.
- I didn't run integration tests, live model calls, a browser or email clients.
- I didn't measure generation time; finding 1 is based on the code's own assumptions plus the 120s limit.
- Production reads were blocked, so "no saved issues in production" is an assumption.
- Line savings are estimates. The prototypes were stopped before completion and their partial results are unreviewed.
