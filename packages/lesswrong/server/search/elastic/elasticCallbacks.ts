import { SearchIndexCollectionName } from "../../../lib/search/searchUtil";
import ElasticClient from "./ElasticClient";
import ElasticExporter from "./ElasticExporter";

export async function elasticSyncDocument(
  collectionName: SearchIndexCollectionName,
  documentId: string,
) {
  try {
    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    await exporter.updateDocument(collectionName, documentId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
  }
}
