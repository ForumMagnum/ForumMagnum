# Name completion in additive mixed search

Implemented and checked against development Elasticsearch on September 11, 2026
(Pacific time; logs use September 12 UTC).

The five requested queries are now permanent rank-one cases in `stressSuite`.

| Query | Intended profile | Before rank | After rank |
| --- | --- | --- | --- |
| Anna S | AnnaSalamon | outside top 10 | 1 |
| Anna Sa | AnnaSalamon | outside top 10 | 1 |
| John | johnswentworth | 3 | 1 |
| John W | johnswentworth | outside top 10 | 1 |
| John We | johnswentworth | outside top 10 | 1 |

## Changes and tradeoffs

User popularity uses `min(10, 2 × log2(1 + karma / 3000))`. Previously it used
`min(4, 0.8 × log2(1 + karma / 100))`. This both increases the weight of karma
and moves saturation from 3,100 to 93,000, allowing established authors to remain
distinguishable. Text scoring and existing person-confidence bonuses still apply.
Content popularity curves are unchanged.

Karma cannot rank a profile that does not match. A general handle-prefix rule
therefore ignores spaces and allows one inserted name character after a literal
four-character anchor. For example, “Samuel P” and “SamuelP” can match
`samuelrpatel`; “Samuel T” cannot, even if that account has more karma. The entire
query must match the prefix, so topic words cannot be silently dropped. Candidate
lookup includes the anchor, and resolution verifies the bounded full prefix.
The existing weak confidence and prominence threshold still apply.

No account-specific aliases, fixed profile text bonuses, public profile changes,
schema changes, or reindexing are involved. The stronger karma weight is a general
tradeoff: popularity can overcome larger text-score differences among matching
profiles, but remains bounded at ten points. The lookup anchor can admit more
candidates before resolution; lookup remains limited to 100 candidates.

The karma changes apply to the additive ranker. Person resolution is shared with
the tiered ranker. At the user's request, the default is now additive, so UI
requests use these changes without an explicit ranking option. Tiered remains
selectable for comparisons. This working-tree change is not a production deployment.

## Verification

Red/green unit tests cover the five queries, competing surnames, spaced and
compact handles, exact navigation without a slug, low-karma exclusion, bounded
insertion, topic guards, and the actual user-karma curve. The generic matching
revision had six failing tests before implementation. All 117 search unit tests
pass; project typechecking and scoped ESLint also pass. Jest requires execution
outside the sandbox here because Next's TypeScript
configuration subprocess returns empty output within it; no test configuration
was changed.

Controlled Elasticsearch fixtures use competing Anna, John, and synthetic Mira
profiles across all five content indexes and two body-length conditions. Before
implementation, the ten requested-name assertions failed (five queries in each
condition). The final fixture suite also covers compact and spaced queries for a
lowercase handle containing an inserted character, with a higher-karma profile
whose surname does not match. All 64 assertions pass, and the runner deleted
all five temporary indexes.

The full development stress suite improved from 25/37 to 31/37. All five new
cases passed, and the existing “ryan” case also improved to a pass. No previously
passing assertion failed. Six existing failures remain outside this change:
“navier-strokes” (rank 9, expected top 3), “navier stokes” (rank 4, expected top 3),
“infra-bayesiansism”, “byrne”, “access past memories”, and “governance” (their
targets remained outside the top 10). These are recorded for follow-up, not
silently counted as passing. Live before/after runs were sequential development
queries, not a shared point-in-time snapshot or production rollout.

A separate topic ambiguity remains: low-karma accounts with exact names such as
“AI” and “Marx” can outrank topic content under the existing lexical and
relationship scoring. This needs a separate ranking decision; there is no special
profile text bonus in this change.

Reproduce with:

```sh
SKIP_VERCEL_CODE_PULL=1 yarn repl dev lw packages/lesswrong/server/scripts/searchRankingEval.ts 'runStressSuite("additive")'
SKIP_VERCEL_CODE_PULL=1 yarn repl dev lw packages/lesswrong/server/scripts/searchRankingFixtures.ts 'runControlledFixtures("/tmp/name-fixtures.json")'
yarn unit packages/lesswrong/unitTests/elastic --runInBand
```


The default switch has red/green regressions covering the UI service request
without a ranking option and the real multi-search execution path. An explicit
tiered request still exercises sequence reservation; additive requests skip it.
All 122 tests across the Elasticsearch and unified-search suites pass after the
default switch.

The running local UI endpoint (`POST /api/search`) was also checked without a
ranking override. Before the switch, “john” returned three accounts named John.
Afterward, “john”, “John”, “John W”, and “John We” returned johnswentworth first;
“Anna S” and “Anna Sa” returned AnnaSalamon first. Scoped ESLint passed. Existing
browser tabs may need reloading to clear the search client's response cache.
