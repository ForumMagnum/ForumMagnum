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
duplicated anywhere else, so deleting and rebuilding indexes will not preserve
the synonym list. `configureIndexes` _does_ preserve synonyms.
