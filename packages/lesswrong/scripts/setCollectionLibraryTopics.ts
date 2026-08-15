import Collections from '@/server/collections/collections/collection';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { LIBRARY_TOPICS, LIBRARY_TOPIC_TAG_SLUGS } from '@/lib/collections/sequences/libraryTopics';

/**
 * Dev helper: backfill each collection's manual libraryTopic with the
 * dominant topic derived from its posts' tags — the topic whose mapped tag
 * (per LIBRARY_TOPIC_TAG_SLUGS, as in the sequences' derived libraryTopics
 * field) matches the most posts, ties broken by LIBRARY_TOPICS order. The
 * sequences' at-least-half threshold is deliberately not applied: broad
 * collections rarely clear it for any topic. Posts are gathered from the
 * collection's books via both direct postIds (HPMOR) and sequenceIds ->
 * chapters (R:A-Z). Run with `yarn repl dev lw` and call
 * setCollectionLibraryTopics() (dryRun defaults true; pass false to write).
 */
export async function setCollectionLibraryTopics(dryRun = true) {
  /* eslint-disable no-console */
  const db = getSqlClientOrThrow();
  const collections = await Collections.find({}, { sort: { createdAt: 1 } }).fetch();

  for (const collection of collections) {
    const rows = await db.any<{topic: string, matched: string, total: string}>(`
      -- setCollectionLibraryTopics
      WITH collection_posts AS (
        SELECT UNNEST(b."postIds") AS post_id
        FROM "Books" b
        WHERE b."collectionId" = $(collectionId)
        UNION
        SELECT UNNEST(c."postIds")
        FROM "Books" b
        JOIN "Chapters" c ON c."sequenceId" = ANY(b."sequenceIds")
        WHERE b."collectionId" = $(collectionId)
      )
      SELECT
        matches.topic,
        matches.matched,
        matches.total
      FROM (
        SELECT
          topic.name AS topic,
          COUNT(p."_id") AS total,
          COUNT(p."_id") FILTER (WHERE COALESCE((p."tagRelevance"->>tag."_id")::INTEGER, 0) >= 1) AS matched
        FROM UNNEST($(topicNames)::TEXT[], $(topicSlugs)::TEXT[]) AS topic(name, slug)
        JOIN "Tags" tag ON tag."slug" = topic.slug AND tag."deleted" IS NOT TRUE
        LEFT JOIN collection_posts cp ON TRUE
        LEFT JOIN "Posts" p ON p."_id" = cp.post_id
        GROUP BY topic.name
      ) matches
      WHERE matches.matched > 0
      ORDER BY matches.matched DESC, matches.topic
    `, {
      collectionId: collection._id,
      topicNames: [...LIBRARY_TOPICS],
      topicSlugs: LIBRARY_TOPICS.map(topic => LIBRARY_TOPIC_TAG_SLUGS[topic]),
    });

    const derived = rows.map(row => `${row.topic} (${row.matched}/${row.total})`).join(', ') || '(none)';
    const maxMatched = rows.reduce((max, row) => Math.max(max, Number(row.matched)), 0);
    const dominant = maxMatched > 0
      ? [...LIBRARY_TOPICS].find(topic => rows.some(row => row.topic === topic && Number(row.matched) === maxMatched)) ?? null
      : null;
    console.log(`${collection.title} [${collection.slug}]: current=${collection.libraryTopic ?? 'null'} derived=[${derived}] -> ${dominant ?? 'unchanged'}`);

    if (!dryRun && dominant && dominant !== collection.libraryTopic) {
      await Collections.rawUpdateOne({ _id: collection._id }, { $set: { libraryTopic: dominant } });
    }
  }
  console.log(dryRun ? 'Dry run only — call setCollectionLibraryTopics(false) to write.' : 'Done.');
}
