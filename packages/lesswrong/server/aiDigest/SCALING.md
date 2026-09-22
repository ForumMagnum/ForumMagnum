# AI digest scaling check — 2026-09-21

PR #12691, baseline `fdff6eefcc`. This change addresses the three unresolved
CommentsRepo scaling discussions with measured query improvements and scheduler
overlap protection. It does not establish production capacity or enable sends.

## Workload and rollout assumptions

- Scheduled emails default to disabled. No local `.env.local` override for
  `private_aiDigestScheduledEmailsEnabled` or `private_aiDigestEmailCadenceDays`.
  Production environment overrides and the actual subscriber count were not read.
- The current scheduler selects only subscribed, non-deleted, non-unsubscribed
  admins with a verified primary email. It runs hourly, processes at most **two
  readers sequentially**, and defaults to a **two-day cadence** with two hours of
  slack. Candidate window is **14 days**; 28 days remains a future rollout choice.
- Maximum nominal drain rate is **48 successful digests/day**, or **96 recipients
  per two-day cadence**, before failures, slow jobs, or missed runs. An initial
  cohort of N requires ceil(N/2) hourly invocations. A 1,000-reader cohort would
  require about 21 days for its first pass: increasing DB throughput alone does
  not make this scheduler a broad rollout mechanism.
- The dev DB lacks `Users.emailSubscribedToAiDigest`, so it cannot supply the
  actual subscribed cohort size. Other digest/history/cache tables exist.
  Dev data has 14 non-deleted admins, of whom 12 have a verified primary email
  and have not unsubscribed from all emails: an upper bound of six hourly batches
  if all 12 opted in. This is a dev-data bound, not the production cohort.
  The checked-in defaults and illustrative cohort sizes above are assumptions,
  not a measurement of production subscriptions.

## Expensive and repeated work

1. Reader dossier starts ten loaders in parallel. Several independently scan
   that reader's read statuses and join posts (authors, topics, ages, recent reads).
   History loads in parallel, bounded to 14 issues, then reads interactions/clicks.
2. Posts, quick takes, curated posts and threads load in parallel. Shared candidate
   lists and site-wide thread rankings are recalculated per recipient. Subscription
   and read/vote/feedback annotations also repeat across sections. This change
   deliberately preserves their freshness and personalization.
3. Thread ranking's candidate-bounded participation lookup from `1a55b684e6`
   remains intact. Its full query on the sampled 30,099-read reader measured
   **61ms (14 days) / 101ms (28 days)** in EXPLAIN ANALYZE, with no physical reads
   in those warm plans. This covers the review's read-post, upvote and participation
   CTE concerns under bounded load; it is not evidence for unlimited concurrency.
   The major newly demonstrated cost was **thread comment body
   loading**, where `COALESCE(topLevelCommentId, _id)` forced a scan of the entire
   Comments table for each reader, before the per-thread 100-comment row cap.
4. Missing summaries load all candidate bodies. In this sample all 60 summaries
   were missing for the configured model/version, making body retrieval the largest
   remaining measured stage after the fix. Production summary/preview generation
   each use queues of eight; these are per generation, not a global limit.
5. Admin sample requests run up to three full generations in parallel. Manual
   generation is outside the scheduler lease; per-user request limits are not a
   fleet-wide concurrency bound. The normal DB pool defaults to 25 connections
   per process, so multiple server processes can multiply demand.

## Changes

- Thread bodies now use separate indexed root/reply predicates. The root arm
  requires `topLevelCommentId IS NULL`, preserving the exact COALESCE semantics.
  Visibility checks, body checks, ordering, caps, ranking, annotations, history,
  and recommendation eligibility are unchanged. No new index or migration.
- Scheduled batches acquire an atomic expiring token in the existing uniquely
  named `DatabaseMetadata` table before querying subscribers. Renew/check before
  each reader and immediately before sending; release only the current token in
  `finally`. The 30-minute expiry permits recovery after killed workers. Unlike
  session advisory locks, no connection is held while waiting for LLM work.
- A failed/expired ownership check prevents sending. Already persisted unsent
  issues retain the existing retry path. Scheduler still processes two readers
  sequentially, and remains disabled by default.

## Measurement method

Verified parent environment `ENV_NAME=localLwDevDb` and a dev-named endpoint
before connecting. Every benchmark connection used read-only sessions, a **15s
statement timeout**, **2s lock timeout**, and an **eight-connection maximum**.
Escalation was 1 → 2 → 4 concurrent reader workloads, with a 10s observed-query
latency stop threshold. No migrations, data writes, emails, notifications, or LLM
requests ran. Lease SQL was only planned with EXPLAIN, never executed.

Dev table estimates: **151,780 posts; 1,105,999 comments; 8,683,977 read statuses;
7,422,779 votes**. There are approximately 38 digest issues and 439 summaries.

Eleven fixed readers: highest-karma and highest-comment-count accounts, five
recently active accounts, and a newest account, deduplicated. Sample ranges:
**0–30,099 read records** and **0–16,653 authored comments**. One sampled reader
had existing recommendation history (15 past recommendation items).

The harness invoked the actual dossier/history/candidate/thread/annotation
functions and extracted the actual repository methods, using the application's
SelectQuery compiler for collection finds and live DB column types. It isolated
imports from app startup and replaced text-only formatting/settings dependencies.
The measured endpoint is the **initial DB read workload through summary cache
lookup and missing summary bodies**, not complete generation. It excludes
LLM-selected tool calls, previews for the eventual selected posts, persistence,
email/notification work, and scheduler eligibility queries (subscription schema
missing). It uses fixed readers/as-of time for both variants. Baseline uses the
PR-head CommentsRepo; after uses the combined worktree change. Both include all
60 missing-summary body reads. Successful cache warmup in real generation would
reduce these repeated body reads; the benchmark deliberately never writes cache
entries. Client times include network/queueing; they are
not database CPU times. Each variant executed 2,322 measured reads across 66
reader workloads, plus setup and plans. These are short warm runs, not sustained
or cold-cache capacity tests; no cache flushing occurred.

| Window | Concurrent readers | Before readers/s | After readers/s | After median/max reader seconds |
|---|---:|---:|---:|---:|
| 14 days | 1 | 0.44 | 0.58 | 1.56 / 2.20 |
| 14 days | 2 | 0.72 | 1.18 | 1.56 / 1.83 |
| 14 days | 4 | 0.97 | 1.68 | 2.26 / 3.46 |
| 28 days | 1 | 0.44 | 0.53 | 1.89 / 2.21 |
| 28 days | 2 | 0.71 | 1.07 | 1.74 / 1.97 |
| 28 days | 4 | 0.91 | 1.51 | 2.43 / 2.77 |

No errors/timeouts in either matched run. Maximum observed individual read latency
fell from 2.35s to 1.33s, including network/pool waits. Average thread-body read
latency across the matched runs fell from **1,240ms to 331ms** (client-side).
An initial paired 28-day site-wide EXPLAIN ANALYZE returned the same 220 comments:
**498ms → 26ms**, parallel sequential scan → bitmap heap/index scans. Shared block
hits fell from 160,900 to 3,015 and physical reads from 49,067 to 37; physical-read
counts reflect cache state and are not a guaranteed per-run reduction.

## Correctness and checks

- **44 before/after comparisons** in one repeatable-read, read-only transaction:
  all 11 readers, both 14/28-day windows, both the normal 100-comment cap and a
  5,000-comment cap to avoid hiding differences. **10,950 returned rows compared;
  every field matched** after sorting by comment ID (SQL has no outer order).
- Paired heavy-reader thread-body plans in that transaction: **530ms → 6ms**
  (14 days), **489ms → 11ms** (28 days). Existing comment indexes were sufficient.
- All three lease statements passed non-executing EXPLAIN against the dev schema,
  including unique-index inference for acquisition. Real concurrent lease writes
  were not tested because this investigation kept database access read-only.
- **96 tests across eight AI-digest suites passed**, including overlap, expiry,
  failed ownership checks, failed sends, retry history and the two-reader cap.
  Typecheck and targeted ESLint passed. No production release or review-thread
  resolution was performed.

## Rollout guidance and remaining limits

Keep **one scheduled generation at a time**, the two-per-hour cap, admin-only
cohort and 14-day window for initial rollout. Four concurrent DB workloads fit
this bounded dev test; that is not a recommendation to run four full production
LLM generations or to increase the cohort. If a wider rollout is approved, start
with two generation workers only after measuring real production read latency,
DB connection pressure, summary-cache reuse, LLM latency/cost and job deadlines.
Use a bounded queue with per-recipient claims before widening the scheduler.

The actual deployed hourly function timeout is unknown; this route has no
maxDuration override, and earlier hourly maintenance consumes some of its runtime.
The test does not cover sustained production traffic, cold caches, future data
growth, broad cohort fairness, or LLM/provider capacity. Repeated failures among
the first due recipients can also consume the small batch's capacity.

The lease prevents ordinary overlapping cron invocations, not exactly-once email
semantics. Generation exceeding 30 minutes can overlap a successor's generation;
the stale worker must fail its subsequent ownership check. A worker suspended
for longer than the lease *after* the pre-send check is not externally fenced.
A successful email followed by failed emailedAt persistence retains the existing
retry/duplicate-send ambiguity. Manual/admin generation is not covered by this
singleton scheduler lease. No review thread was marked resolved.

## Local evidence artifacts

The isolated harness is `/private/tmp/ai-digest-scaling-benchmark.cjs`; matched
results are `/private/tmp/digest-scaling-before.json` and
`/private/tmp/digest-scaling-after.json`. Additional plans are in
`/private/tmp/digest-thread-body-plans.json` and
`/private/tmp/digest-reader-heavy-plans.json`. These are temporary local artifacts;
the measurements and limitations above are the durable PR record. The harness
requires this worktree's dependencies, runs from this worktree, and verifies the
parent dev environment before connecting. It does not import generation/sending
entry points. Reproduction commands (dev reads only):

```sh
DIGEST_BASELINE=fdff6eefcc node /private/tmp/ai-digest-scaling-benchmark.cjs /private/tmp/digest-scaling-before.json
node /private/tmp/ai-digest-scaling-benchmark.cjs /private/tmp/digest-scaling-after.json
```
