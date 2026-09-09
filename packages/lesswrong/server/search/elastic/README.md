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

Unified search uses explicit relationship tiers. Within a tier, text relevance is
multiplied by `1 + 3 * max(karma, 0) / (max(karma, 0) + pivot)`, then bounded so it
cannot overtake the next tier. Pivots are 50 for posts/sequences/tags, 10 for comments,
and 1,000 for profiles. Tags use their own karma (`baseScore`), not linked-post
count: a widely used tag should not outrank high-karma posts just because many
posts link to it. Missing karma contributes zero. Sequences use the average
karma of their distinct public, approved, nonnegative-karma posts.

For recognized person searches, the order is matching profiles, up to two
featured sequences collecting their writing, authored/coauthored posts and other
related sequences, title/name matches, authored comments, body mentions, then
other comments. Sequence ownership alone is not authorship. A comment merely
under the author's post does not qualify.

Exact display names/slugs can resolve a person. A complete first name can resolve
an author when it has at least four characters and the author has at least 1,000
karma. Ambiguous matches to the same name span are retained. Name lookup considers
up to 100 candidates. Additional topic words must match the result's content;
advanced query syntax uses the established query parser without inferred people.

For ordinary topic searches, exact titles/names precede other complete title/name
matches, body matches, and comment matches. Age is not penalized. Elasticsearch
performs pagination and exact counting after ranking, with document ID and index
as stable score tie-breakers. Sequence promotion is selected independently of the
requested page.

### Rollout

No PostgreSQL migration or GraphQL generation is needed. The new Elasticsearch
fields must be populated from PostgreSQL: post coauthor IDs, sequence collected
author IDs, and sequence karma. Sequence title mappings also gain the normal
full-text subfields. Existing single-record post updates and chapter mutations
refresh affected sequence documents.

The explicit rebuild helper has **not been run** as part of this change. Start
with the development environment:

```sh
yarn repl dev lw packages/lesswrong/server/scripts/elastic.ts
```

Then invoke `await rebuildRelationshipSearchIndexes()` in the REPL. Confirm the
selected database and Elasticsearch environment before doing a production rebuild.
The helper rebuilds Posts and Sequences from the selected database, preserves
synonyms, and atomically switches each index alias once its export is complete.
`configureIndexes()` alone copies existing Elasticsearch documents and does not
backfill the new relationship fields.

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
