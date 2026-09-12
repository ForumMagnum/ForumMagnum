# Elasticsearch

This directory implements full-text search of the forum content using
Elasticsearch with an external interface compatible with Algolia and
InstantSearch.

You will need to add instance settings for the `cloudId`, `username` and
`password` in order to connect (see `ElasticClient.ts`).

You can then run (replace "dev" with "staging" or "prod" as applicable)
```
yarn repl dev packages/lesswrong/server/scripts/elastic.ts 'configureIndexes()'
yarn repl dev packages/lesswrong/server/scripts/elastic.ts 'exportAll()'
```
to initialize the indexes and export the data (which may take some time).

When making changes to mappings, `configureIndexes` will update the
mappings accordingly and reindex the existing data.

When a new instance is created it will have an empty list of synonyms. These
can be edited at the `/admin/synonyms` page. Note that synonyms are not
duplicated anywhere else, so deleting indexes before rebuilding loses the synonym
list. Both `configureIndexes` and `recreateIndex` preserve synonyms while replacing
an existing index.

## Unified search ranking

`ElasticMultiQuery.compileMultiQuery` accepts `ranking: "tiered" | "additive"`.
The default is `additive`, including UI requests that omit a ranking option.
The `tiered` compiler remains explicitly selectable for comparisons. This change
is enabled in the working tree; it has not been deployed to production or
rebuilt production indexes.

### Additive scoring

Each candidate receives bounded points on a shared scale:

```
score = T + H + N + A + P × G(T) + C + 2
T = 3 × BM25² / (BM25² + k²) + allTerms + phrase
P = min(popularityCap, popularitySlope × log2(1 + max(karma, 0) / popularityPivot))
G(T) = 0.1 + 0.9 × min(T / 5, 1)²
```

| Signal | Behavior |
|---|---|
| T, topical evidence | Raw content-only BM25 contributes 0–3, complete analyzed term coverage adds 1, title/body phrase proximity adds 1. Author metadata and recall boosts never contribute. |
| H, title coverage | Adds 1 for multiple content tokens or 0.5 for a single content token. Complete analyzed coverage or title-prefix coverage qualifies once. |
| N, navigation | Exact title adds 0/2.5/4.5 for 1/2/3+ content tokens. Unfinished title prefixes receive the same bounded preference. Identifiers add 8 within identifier-only eligibility. |
| A, relationship | Exact/strong/weak profiles add 6/5/4; authored posts and sequences 3/3/2; authored comments 2/2/1.5. Use the strongest relationship once. Minor exact accounts receive half the profile points. |
| C, context | Curated posts add 0.5; unresolved profiles subtract 0.5. Comments have no fixed penalty. Future events can add up to 1 when event intent is present. |

The constant 2 keeps Elasticsearch function scores nonnegative and does not
change ordering. Popularity pivots are posts 15, comments 4, users 3,000, tags 5,
sequences 15. User popularity has slope 2 and cap 10; content popularity keeps
slope 0.8 and cap 4. Raw BM25 pivots are posts 8.1, comments 7.6, users 12.9, tags 5.9,
sequences 3.8, calibrated from 150 deterministically selected development queries
using multi-index DFS. A raw score equal to its pivot earns 1.5 points. These
are initial measured development parameters, not universal relevance constants.

A title prefix earns one proximity point outside the popularity gate when it
has not already earned ordinary phrase proximity. Its navigation bonus requires
an unfinished final word. Prefix scoring uses the same bounded 50-completion
budget as recall; a smaller scoring budget silently dropped “college” for
“american coll” in the real index. Complete topic phrases such as “lab automation” do
not gain it simply because a title continues afterward. Generic exact titles
such as “History” have no unconditional priority. No ordinary title or profile
is mathematically guaranteed first place.

Recall searches exact and stemmed/synonym fields together, with bounded fuzzy
and prefix alternatives. Recall is a filter, separate from topical scoring.
For a single 12–24-letter ASCII word, a bounded fallback tries adjacent title/name
tokens with one edit per part, two fixed prefix letters and at most five fuzzy
expansions per part. This handles joined compounds such as
“infrabayesiansism” → “Infra-Bayesianism” without a query whitelist. Its raw
span evidence competes by maximum with ordinary topical BM25 and can earn the
single all-terms point. It has no extra navigation bonus. Short words, bodies,
and advanced syntax do not get compound recovery. This specialized fallback
was added after the general BM25 calibration; its latency and relevance need
monitoring on production-scale traffic.

Raw 17-character IDs must contain an uppercase letter or digit; lowercase-only
17-letter strings remain text to avoid interpreting natural-language typos as
IDs. 24-character hexadecimal IDs and internal LW/AF URLs are recognized.
Internal URLs also support lowercase-only IDs. Identifier-only searches still
apply all eligibility and permission-related filters.

Person resolution keeps all plausible candidates for the selected name span,
with confidence per candidate. Public full names, display names and slugs
support real-name aliases, surnames, prefixes and bounded typos. A prominent
account has at least 1,000 karma. Exact minor accounts remain possible matches.
For author-plus-topic queries, the original query and residual topic compete
by maximum; only that author's documents qualify for the residual branch.
“roko” can therefore retrieve both the author and topic results. Multiple
coauthors and related sequences cannot accumulate repeated relationship points.
Resolved profile IDs receive the full popularity gate; unrelated profile hits
do not inherit it.

User karma reaches its ten-point cap at 93,000 karma. This gives prominence
more weight while retaining differences among established accounts. Text scores
and existing confidence bonuses continue to apply normally.

A general handle-prefix match ignores spaces and allows one extra character in
the indexed name after a literal four-character anchor. It matches the entire
query as a prefix, retaining weak confidence and the existing prominence
threshold. The short trailing letters must still match literally: “Samuel P”
can match `samuelrpatel`, but “Samuel T” cannot. This rule also applies to compact
queries such as “SamuelP”. Candidate lookup retrieves the literal anchor; person
resolution then enforces the bounded prefix match. There are no account-specific
aliases or scores. The [name-completion report](ranking-name-completion-2026-09-11.md)
records the five regression queries, validation, and remaining search issues.

Event freshness requires an event-related query or positive event filter. Only
future `startTime` values receive a bonus, flat for seven days and decaying with
a 30-day half-value distance thereafter. Explicit years or date/time filters
disable it. Classic essays and past events receive no age penalty. Current
opportunities without event metadata have no reliable deadline signal yet.

### Evaluation and release decision

Run these development-only helpers through the REPL:

```sh
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingFixtures.ts 'runControlledFixtures()'
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'calibrateMatchPivots(undefined, 150)'
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'inspectAliasCoverage()'
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'compareRankings()'
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'evaluateJudgedSearches()'
yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'showQuery("lab automation", "additive")'
```

The evaluator expects the reports under `/tmp/forum-search-report`. It compares
427 normalized header queries from 481 searchBar evidence rows, separately from
tabbed-page/editor clicks. Targets are collection-qualified IDs. Absent and
ineligible targets are reported separately; paired metrics require both
rankings to succeed. Connected components join shared targets and all 39 intent
families before a deterministic training/holdout split. Both partitions were
inspected during tuning, so results are exploratory, not an untouched holdout.

Full comparisons use one Elasticsearch point-in-time snapshot for eligibility,
person lookup and both rankers, retaining DFS. Reports record source/input
hashes, weights, physical indexes, mappings, counts, failures and individual
ranked results. Calibration is separately reported and is not PIT-frozen.
Incomplete or timed-out searches fail instead of becoming relevance misses.

Controlled fixtures clone actual development analyzers into temporary indexes,
exercise real compiled queries at two body lengths, and clean up only their own
indexes. Clicks remain weak positive candidates: they contain neither result
impressions nor original karma and cannot label unclicked results irrelevant.
The reviewed lab-automation pool includes actual indexed text and karma, with
explicit relevant-body versus misleading-title pairs. Its coverage is too small
to establish broad discovery quality. The [final measured report](ranking-evaluation-2026-09-10.md) records the frozen
comparison, limitations and release decision; detailed JSON artifacts remain in
`/tmp/forum-search-report`.

The additive default was enabled at the user's request after the name-completion
regressions passed. Broader independently judged relevance and representative-load
latency remain useful follow-up validation. The tiered compiler remains the
comparison baseline, including its rigid post/comment and relationship boundaries.

### Rollout

The ranking itself needs no PostgreSQL migration. The new Elasticsearch
fields must be populated from PostgreSQL: post coauthor IDs, sequence collected
author IDs, sequence karma, and public user `fullName` aliases. Sequence title mappings also gain the normal
full-text subfields. Existing single-record post updates and chapter mutations
refresh affected sequence documents.

The development Users index was rebuilt on 2026-09-10 with
`rebuildUserSearchIndex()` from `server/scripts/elastic.ts` after
`previewUserSearchAliases(userIds)` verified public aliases in PostgreSQL.
The exporter verified 206,916 records before switching the alias. Older Users
indexes with no `fullName` values need the same backfill; mapping changes alone
do not populate aliases.

The rebuild helper was run against the development environment on 2026-09-10
(Posts and Sequences). It has not been run in production. Start with the
development environment:

```sh
yarn repl dev lw packages/lesswrong/server/scripts/elastic.ts
```

Then invoke `await rebuildRelationshipSearchIndexes()` in the REPL. Confirm the
selected database and Elasticsearch environment before doing a production rebuild.
The helper rebuilds Posts and Sequences from the selected database, preserves
synonyms, and atomically switches each index alias once its export is complete.
`configureIndexes()` alone copies existing Elasticsearch documents and does not
backfill the new relationship fields.

The search-page Questions and Shortform filters require the `question` and
`shortform` fields from the current Posts exporter. For an existing index, run
`await backfillPostSearchFlags()` from the script module above. This updates only
those flags on existing documents, skips absent documents (404), and refreshes
Posts after completion. It does not create documents or replace indexes. A full
Posts export or rebuild also populates the flags.

Development refresh completed on 2026-09-10: 150,379 database rows processed,
49,211 existing search documents updated, 101,168 absent documents skipped, and
zero indexing errors. One empty-ID database fixture was excluded because
Elasticsearch cannot index it. Live question and shortform searches were verified
after the refresh. Other environments still require this explicit backfill.

Search-page sorters use exact values in the displayed priority order; later keys
only break ties. Post types refine posts without removing other selected content
kinds. Events are controlled independently, and numeric range bounds both apply.

### Removing stale documents

Bulk exports update or insert current records but do not remove documents whose
IDs have disappeared from PostgreSQL. To remove them, use
`await new ElasticExporter().recreateIndex("Tags")` from the exporter module in
the development REPL. This exports current database records into a new backing
index, preserves synonyms, refreshes the new index, and verifies its document
count against the database before atomically switching the alias. Export errors,
failed shards, or a count mismatch abort the switch and leave the old index
serving searches. The old backing index is retained for rollback.

The export is not a database snapshot: concurrent collection writes can cause a
count mismatch, and the count check cannot detect updates or a delete/insert pair
that preserves the count.
Deleted records still present in PostgreSQL are exported with their deletion flag;
normal search filters exclude them.
