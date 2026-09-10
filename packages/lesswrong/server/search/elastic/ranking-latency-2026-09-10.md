# Search ranking latency benchmark — 2026-09-10

Additive has 11.8% lower mean latency and 16.9% lower median latency in this development benchmark. It is faster on 343 of 427 queries (80.3%), using each query’s average over two measured passes. The p95 is effectively unchanged; p99 is 20.3% worse.

## Method

Used all 427 normalized real header-search queries from the existing click-target evaluation, including queries whose clicked target is missing or ineligible. Every unique query has equal weight; this is not weighted by production search frequency.

One complete warm-up pass was excluded, followed by two measured passes: 854 measured searches per ranker, 2,562 searches including warm-up, zero failures. A single client ran requests sequentially. Query order was deterministically shuffled using the existing hash; ranker order alternated by query and reversed on the second pass. Verified every query has exactly one result from each ranker in each pass.

Both rankers used one shared development Elasticsearch point-in-time snapshot, five content indexes, top 10 results, highlighting and exact hit counts. Timing includes query compilation, person lookup, the tiered sequence lookup when applicable, transport, and PIT request rewriting. It excludes REPL startup, snapshot setup, and report writes. Elasticsearch time is the sum of response `took` values across the search’s requests, not a CPU measurement.

Run: 2026-09-10T18:59:39.252Z to 2026-09-10T19:11:47.587Z. Environment: `localLwDevDb`.

## Measured results

| End-to-end metric | Tiered | Additive |
|---|---:|---:|
| Mean | 306.6 ms | 270.5 ms |
| Median | 289.7 ms | 240.8 ms |
| p95 | 469.2 ms | 469.8 ms |
| p99 | 639.1 ms | 768.7 ms |
| Maximum | 913.8 ms | 1185.7 ms |

Percentiles use the nearest-rank method; medians average the two middle observations. The table pools both measured passes, rather than averaging their percentiles.

Mean summed Elasticsearch processing time was 116.1 ms tiered versus 106.1 ms additive (8.6% lower). Its p99 was 297 ms versus 329 ms. The end-to-end gain therefore includes both reduced Elasticsearch work and fewer round trips.

Both passes favored additive on average: pass 1 was 314.5 → 279.7 ms; pass 2 was 298.8 → 261.2 ms. Tail timings varied between passes, so the exact p99 difference needs more repetitions before treating it as a stable production estimate.

## Request-count groups

| Tiered requests per search | Queries | Tiered mean | Additive mean |
|---|---:|---:|---:|
| 1 | 2 | 91.4 ms | 101.3 ms |
| 2 | 229 | 284.2 ms | 267.3 ms |
| 3 | 196 | 335.1 ms | 275.9 ms |

For 196 queries, additive eliminates the tiered ranker’s sequence lookup, reducing three requests to two and saving 59.2 ms on average. Where both make two requests, additive saves 16.9 ms on average. The two single-request queries skip person lookup.

## Largest query regressions

Times below average both measured passes. Network variation contributes to some differences; Elasticsearch columns help distinguish this from engine processing.

| Query | Tiered total | Additive total | Tiered ES | Additive ES |
|---|---:|---:|---:|---:|
| `productivity` | 305.2 ms | 845.7 ms | 132.5 ms | 269.5 ms |
| `hodge conjecture` | 373.0 ms | 817.5 ms | 168.5 ms | 215.5 ms |
| `elementary condensation` | 319.7 ms | 707.7 ms | 184.0 ms | 336.5 ms |
| `sandy hook` | 264.9 ms | 625.3 ms | 126.0 ms | 202.0 ms |
| `counterargume` | 336.3 ms | 667.4 ms | 132.5 ms | 269.5 ms |
| `lighthaven dc` | 399.4 ms | 693.0 ms | 159.0 ms | 284.5 ms |
| `johnswentwroth` | 354.6 ms | 580.6 ms | 144.0 ms | 407.5 ms |
| `paulfchristi` | 337.5 ms | 525.0 ms | 130.0 ms | 341.0 ms |
| `johnswentworth` | 357.8 ms | 544.5 ms | 146.5 ms | 365.0 ms |
| `diamondoid` | 349.7 ms | 530.7 ms | 113.0 ms | 100.5 ms |

These regressions remain follow-up work; this benchmark changes no ranking behavior or defaults.

## Limits and reproduction

This measures serial development-cluster latency, not production throughput or browser-visible latency. The shared PIT wrapper changes shard routing, particularly for preliminary lookups, and adds JSON rewriting overhead. Existing cluster cache state and external load were not controlled. Results establish a comparison under this setup, not a production latency guarantee.

Run with the existing development environment and analytics artifacts:

```sh
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'benchmarkRankings()'
```

Inputs: `/tmp/forum-search-report/query-target-evidence.csv` and `intent-inventory.json`. Raw samples, source hashes and corpus metadata: `/tmp/forum-search-report/ranking-latency.json`. Per-query means and summaries: `/tmp/forum-search-report/ranking-latency-summary.json`. Summary calculation: `/tmp/forum-search-report/summarize-latency.py`.

Validation: `yarn tsc`, scoped ESLint, and `git diff --check` passed. Sample completeness, paired order reversal and zero failures were checked directly in the raw artifact.

Operational note: the first REPL launch could not refresh Vercel configuration under restricted networking. The completed run used the existing local development configuration with `SKIP_VERCEL_CODE_PULL=1` and approved network access. REPL command errors can exit successfully in the existing runner, so completion was verified from the raw report rather than exit code alone.
