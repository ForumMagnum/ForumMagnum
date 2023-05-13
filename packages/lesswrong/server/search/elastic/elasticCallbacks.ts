import {
  AlgoliaIndexCollectionName,
  algoliaIndexedCollectionNames,
} from "../../../lib/search/algoliaUtil";
import { getCollectionHooks } from "../../mutationCallbacks";
import ElasticSearchClient from "./ElasticSearchClient";
import ElasticSearchExporter from "./ElasticSearchExporter";

export const elasticSyncDocument = (
  collectionName: AlgoliaIndexCollectionName,
  documentId: string,
) => {
  try {
    const client = new ElasticSearchClient();
    if (!client.isConnected()) {
      return;
    }
    const exporter = new ElasticSearchExporter(client);
    void exporter.updateDocument(collectionName, documentId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
  }
}

for (const collectionName of algoliaIndexedCollectionNames) {
  const callback = ({_id}: DbObject) => elasticSyncDocument(collectionName, _id);
  getCollectionHooks(collectionName).createAfter.add(callback);
  getCollectionHooks(collectionName).updateAfter.add(callback);
}
