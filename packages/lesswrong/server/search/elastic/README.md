# Elasticsearch

This directory implements full-text search of the forum content using
Elasticsearch with an external interface compatible with Algolia and
InstantSearch.

You will need to add instance settings for the `cloudId`, `username` and
`password` in order to connect (see `ElasticClient.ts`).

You can then run
```
Globals.elasticConfigureIndexes()
Globals.elasticExportAll()
```
to initialize the indexes and export the data (which may take some time).

When making changes to mappings, `elasticConfigureIndexes` will update the
mappings accordingly and reindex the existing data.

When a new instance is created it will have an empty list of synonyms. These
can be edited at the `/admin/synonyms` page. Note that synonyms are not
duplicated anywhere else, so deleting and rebuilding indexes will not preserve
the synonym list. `elasticConfigureIndexes` _does_ preserve synonyms.

---
Misc:
- Make sure `algolia.indexPrefix` is set to empty string in database settings (should be a default in upstream now)
- If for some reason you get `invalid_alias_name_exception` (happened to me twice) - one option is to run
`DELETE /*` on ElasticSearch (which deletes all indexes and aliases) and then re-run `elasticConfigureIndexes` 

---
How to add a new field to be indexed: see the commit this edit was made in for example. 