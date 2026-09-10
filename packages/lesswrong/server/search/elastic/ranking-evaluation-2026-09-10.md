# Additive ranking evaluation — 2026-09-10

The implementation is complete as an explicitly selectable ranking candidate.
**Keep `defaultUnifiedRanking = "tiered"`.** Controlled behavior is substantially
improved, but the final evidence does not justify replacing the default:
training destination retrieval improves while exploratory holdout ordering
regresses, and the small discovery judgment pool does not show an overall win.
No production ranking or production index was changed.

## Implemented behavior

The [ranking README](README.md#additive-scoring) documents the exact formulas.
Content-only saturated BM25, term coverage and phrase proximity determine the
popularity gate. Bounded title/navigation/relationship points are added outside
that gate. Original queries and author-plus-topic interpretations compete by
maximum, with residual topics restricted to that author's documents. Related
sequences and multiple coauthors cannot accumulate repeated relationship points.
Comments have no unconditional type penalty; generic one-word exact titles
receive no navigation bonus. Freshness applies only to upcoming events with
relevant intent, never as an age penalty on classic essays.

Public full-name aliases, surnames, handle prefixes and name typos are supported.
The development Users index was rebuilt and verified before switching its alias:
206,916 users, including 14,196 populated public full names. The previous index
had 182,744 users and zero full names. These data changes affect both rankers;
comparisons against earlier exports cannot isolate model improvements.

Two concrete compiler defects were fixed during final validation. The 17-letter
query `infrabayesiansism` was incorrectly interpreted as a raw document ID;
lowercase alphabetic strings of that length now remain text, while internal URLs
still support such IDs. Bounded adjacent fuzzy title-token spans recover joined
compound terms without a typo whitelist. Separately, scoring allowed only ten
prefix completions while recall allowed fifty: the real `american coll` target
matched at fifty and not at ten. Scoring now consistently uses fifty, and the
48-karma intended post returns at rank one. Neither fix changes the popularity
weight or introduces rigid type tiers.

## Frozen comparison

The final run evaluated 427 normalized header queries from 481 searchBar rows
and 469 typed query–target associations. There were 362 eligible associations,
96 absent and 11 ineligible. Paired metrics cover 341 queries; 86 queries had no
eligible target. All searches completed, with zero request or query failures.
Each query's two rankings and target eligibility used one Elasticsearch
point-in-time snapshot opened at 2026-09-10T18:30:08.602Z and completed at
2026-09-10T18:33:44.275Z. Live index metadata changed during the run; the PIT kept the
evaluated corpus fixed. Reopening a PIT produces a new snapshot.

| Cohort | Queries | MRR, tiered → additive | Success@3 | Success@10 |
|---|---:|---:|---:|---:|
| Training click candidates | 283 | 0.580 → 0.625 | 64.7% → 69.6% | 73.5% → 79.5% |
| Training navigation | 58 | 0.601 → 0.681 | 67.2% → 69.0% | 72.4% → 77.6% |
| Exploratory holdout click candidates | 58 | 0.673 → 0.582 | 75.9% → 63.8% | 79.3% → 79.3% |
| Exploratory holdout navigation | 5 | 0.700 → 0.673 | 80.0% → 60.0% | 80.0% → 100.0% |

Shared query variants, typed targets and the 39 intent families are connected
before the deterministic split. Both partitions were inspected during tuning:
“holdout” here is a reproducible partition, not an untouched validation set.
Clicks are weak positive destinations, with no impressions or original karma.
These metrics measure retrieval of observed destinations, not ideal relevance.
The five-query navigation holdout is particularly small.

## Controlled and real examples

All **50 controlled Elasticsearch cases pass**, across two body lengths using
actual development mappings and analyzers in isolated temporary indexes. These
cover popular substantive body over weak title, modest relevant content over a
million-karma passing mention, generic titles, excellent comments, author/sequence
competition, aliases, unfinished titles, joined compounds including an unseen
`chemicalenginering` example, word order, identifiers, Unicode, event intent,
pagination and eligibility. Temporary indexes were deleted after each run.
The dense-prefix fixture guards the desired result against a fuzzy body match;
only the actual corpus diagnostic demonstrated the ten-versus-fifty completion
failure, so the synthetic case is not claimed as a red/green reproduction.

Real development searches put `evan hubinger`, `kwa`, `paulf` and
`johnswentwroth` at their intended profiles in first place. `navier` and
`navier-strokes` both return the observed recent post first. The malformed
`infrabayesiansism` retrieves the relevant introduction first and concept page
third. `roko` includes both the profile and basilisk content in its first ten.
The expected original “A Pragmatic Vision for Interpretability” document is
absent from this development corpus; its real destination cannot be validated
here, while the synthetic distinctive-title invariant passes.

The biological-lab-automation judgment pool contains ten inspected documents.
The clicked biology essay has **28 karma**, not the hypothetical 300-karma
example from the original proposal. It ranks tiered 2 / additive 7. Both rankers
place it above the judged wrong-domain alternatives; additive excludes those
alternatives from its first 100. Condensed judged-pool nDCG is 0.710 / 0.631,
with only 6 / 3 judged documents among the respective first ten. Unjudged results
are excluded from the condensed metric, not labeled irrelevant. This limited
pool supports the explicit pairs but does not establish broad discovery quality.

A small repeated live sample measured approximately 180–1,096 ms end to end;
the compound typo took 866–1,096 ms and `american coll` 261–262 ms. These timings
include person lookup, network and concurrent evaluation load. They are a
latency diagnostic, not a production benchmark.

## Calibration, validation and readiness

Post-rebuild calibration used 150 deterministically sampled training queries
plus resolved residual topics, with zero failures. Raw topical medians were
posts 8.359, comments 7.596, users 13.186, tags 5.865 and sequences 3.750.
The retained pivots are 8.1, 7.6, 12.9, 5.9 and 3.8. Calibration is separately
reported and not PIT-frozen; the compound fallback was introduced after the
initial calibration. The prefix completion fix does not alter raw topical BM25.

Validation: nine Elasticsearch unit suites, **81 tests**, full `yarn tsc`, scoped
ESLint with zero warnings, and `git diff --check` pass. The integration work also
ran `yarn generate`. The source/input hashes, weights, physical indexes, mapping
hashes and individual results are stored in the JSON report.

Before selecting additive by default, use a broader independently judged pool
covering ambiguous author/topic queries and new top results, validate missing
known-title targets on a representative corpus, and measure representative
latency. Opportunity freshness still needs trustworthy deadline/availability
metadata; the implemented event signal cannot infer that an application is open.
Use `ranking: "additive"` explicitly or `showQuery(query, "additive")` for review.

Detailed artifacts in `/tmp/forum-search-report`:

- `takeover-evaluation-final.json`: final frozen comparison and provenance.
- `takeover-evaluation-before-prefix-fix.json`: earlier frozen diagnostic snapshot.
- `controlled-fixtures.json`: 50 passing real-engine synthetic cases.
- `author-alias-coverage.json`, `user-alias-rebuild.log`: verified alias backfill.
- `topical-calibration-final.json`: post-rebuild raw-score calibration.
- `judged-ranking-evaluation.json`, `lab-automation-judgment-pool.json`: real judgments.
- `live-ranking-examples.json`, `final-navigation-examples.log`: actual destinations.
- `prefix-expansion-diagnostic.log`: direct ten/fifty/hundred completion comparison.
- `finish-unit.log`, `finish-types.log`, `finish-lint.log`: final validation.
