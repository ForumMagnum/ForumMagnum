import {
  SearchIndexCollectionName,
  searchIndexedCollectionNames,
} from "../../../lib/search/searchUtil";
import { getCollectionHooks } from "../../mutationCallbacks";
import { UsersRepo } from "../../repos";
import ElasticClient from "./ElasticClient";
import ElasticExporter from "./ElasticExporter";
import { isElasticEnabled } from "./elasticSettings";

export const elasticSyncDocument = (
  collectionName: SearchIndexCollectionName,
  documentId: string,
) => {
  try {
    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    void exporter.updateDocument(collectionName, documentId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
  }
}

if (isElasticEnabled) {
  for (const collectionName of searchIndexedCollectionNames) {
    const callback = ({_id}: DbObject) => elasticSyncDocument(collectionName, _id);
    getCollectionHooks(collectionName).createAfter.add(callback);
    getCollectionHooks(collectionName).updateAfter.add(callback);
  }

  getCollectionHooks("Users").editAsync.add(async function reindexDeletedUserContent(
    newUser: DbUser,
    oldUser: DbUser,
  ) {
    if (newUser.deleted && !oldUser.deleted) {
      const repo = new UsersRepo();
      const [
        postIds,
        commentIds,
        sequenceIds,
      ] = await Promise.all([
        repo.getAllUserPostIds(newUser._id),
        repo.getAllUserCommentIds(newUser._id),
        repo.getAllUserSequenceIds(newUser._id),
      ]);

      const client = new ElasticClient();
      const exporter = new ElasticExporter(client);

      for (const id of postIds) {
        await exporter.updateDocument("Posts", id);
      }

      for (const id of commentIds) {
        await exporter.updateDocument("Comments", id);
      }

      for (const id of sequenceIds) {
        await exporter.updateDocument("Sequences", id);
      }
    }
  });
}
