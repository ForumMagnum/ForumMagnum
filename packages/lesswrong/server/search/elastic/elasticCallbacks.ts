import {
  SearchIndexCollectionName,
  searchIndexedCollectionNames,
} from "../../../lib/search/searchUtil";
import { getCollectionHooks } from "../../mutationCallbacks";
import ElasticClient from "./ElasticClient";
import ElasticExporter from "./ElasticExporter";
import { isElasticEnabled } from "../../../lib/instanceSettings";

export const elasticSyncDocument = async (
  collectionName: SearchIndexCollectionName,
  documentId: string,
) => {
  try {
    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    await exporter.updateDocument(collectionName, documentId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
  }
}

export const registerElasticCallbacks = () => {
  if (!isElasticEnabled) {
    return;
  }

  for (const collectionName of searchIndexedCollectionNames) {
    const callback = ({_id}: DbObject) => elasticSyncDocument(collectionName, _id);
    getCollectionHooks(collectionName).createAsync.add(({ document }) => callback(document));
    getCollectionHooks(collectionName).editAsync.add(callback);
  }
}
