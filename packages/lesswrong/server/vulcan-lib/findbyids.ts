import { runSqlQuery } from "../../lib/sql/sqlClient";

const fetchUnorderedDocumentsWithoutCache = <T extends DbObject>(
  collection: CollectionBase<T>,
  ids: string[],
): Promise<T[]> =>
  collection.isPostgres()
    ? runSqlQuery(
        ` SELECT * FROM "${collection.collectionName}" WHERE _id IN ( $1:csv )`,
        [ids],
        "read"
      )
    : collection.find({ _id: { $in: ids }}).fetch();

const fetchUnorderedDocumentsWithCache = async <T extends DbObject>(
  collection: CollectionBase<T>,
  ids: string[],
): Promise<T[]> => {
  const cachedDocuments: T[] = [];
  let uncachedIds: string[] = ids;

  const {crossRequestCache} = collection;
  if (crossRequestCache) {
    uncachedIds = [];
    for (const id of ids) {
      const cached = crossRequestCache.get(id);
      if (cached) {
        cachedDocuments.push(cached);
      } else {
        uncachedIds.push(id);
      }
    }
  }

  const documents = uncachedIds.length > 0
    ? await fetchUnorderedDocumentsWithoutCache(collection, uncachedIds)
    : [];

  if (crossRequestCache) {
    for (const doc of documents) {
      crossRequestCache.set(doc._id, doc);
    }
  }

  return [...cachedDocuments, ...documents];
}

/**
 * @summary Find by ids, for DataLoader, inspired by https://github.com/tmeasday/mongo-find-by-ids/blob/master/index.js
 */
const findByIds = async <T extends DbObject>(
  collection: CollectionBase<T>,
  ids: Array<string>,
): Promise<Array<T|null>> => {
  if (ids.length === 0) return [];

  if (ids.length === 1) {
    return [await collection.findOne({_id: ids[0]})];
  }

  // get documents
  const documents = await fetchUnorderedDocumentsWithCache(collection, ids);

  // order documents in the same order as the ids passed as argument
  let docsByID: Record<string,T> = {};
  documents.forEach(doc => {docsByID[doc._id] = doc});
  return ids.map(id => docsByID[id]);
};

export default findByIds;
