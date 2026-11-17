import Chapters from "@/server/collections/chapters/collection";
import { isAnyTest } from "@/lib/executionEnvironment";
import { SearchIndexCollectionName } from "../../../lib/search/searchUtil";
import ElasticClient from "./ElasticClient";
import ElasticExporter from "./ElasticExporter";
import { isElasticEnabled } from "@/lib/instanceSettings";

interface ElasticSyncOptions {
  /**
   * Also re-export the sequences containing this post. A sequence's document is
   * built from its posts' visibility, authors and baseScore, so pass this when
   * one of those may have changed. Votes don't pass it, so a sequence picks up
   * baseScore changes (its average, and posts crossing zero) only on the next
   * edit to its posts or chapters.
   */
  includeSequences?: boolean,
}

export async function elasticSyncDocument(
  collectionName: SearchIndexCollectionName,
  documentId: string,
  {includeSequences = false}: ElasticSyncOptions = {},
) {
  if (!isElasticEnabled()) {
    return;
  }
  try {
    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    await exporter.updateDocument(collectionName, documentId);
    if (collectionName === "Posts" && includeSequences) {
      const chapters = await Chapters.find({postIds: documentId}, {}, {sequenceId: 1}).fetch();
      for (const sequenceId of new Set(chapters.map(chapter => chapter.sequenceId))) {
        if (sequenceId) await exporter.updateDocument("Sequences", sequenceId);
      }
    }
  } catch (e) {
    // This is extremely noisy and unhelpful in integration test logs
    if (!isAnyTest) {
      // eslint-disable-next-line no-console
      console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
    }
  }
}
