import Chapters from "@/server/collections/chapters/collection";
import { isAnyTest } from "@/lib/executionEnvironment";
import { SearchIndexCollectionName } from "../../../lib/search/searchUtil";
import ElasticClient from "./ElasticClient";
import ElasticExporter from "./ElasticExporter";
import { isElasticEnabled } from "@/lib/instanceSettings";

export async function elasticSyncDocument(
  collectionName: SearchIndexCollectionName,
  documentId: string,
) {
  if (!isElasticEnabled()) {
    return;
  }
  try {
    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    await exporter.updateDocument(collectionName, documentId);
    if (collectionName === "Posts") {
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
