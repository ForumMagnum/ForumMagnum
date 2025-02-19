import { runSqlQuery } from "@/server/sql/sqlClient";

/**
 * @summary Find by ids, for DataLoader, inspired by https://github.com/tmeasday/mongo-find-by-ids/blob/master/index.js
 */
const findByIds = async <N extends CollectionNameString>(
  collection: CollectionBase<N>,
  ids: Array<string>,
): Promise<Array<ObjectsByCollectionName[N]|null>> => {
  if (ids.length === 0) return [];
  
  if (ids.length === 1) {
    return [await collection.findOne({_id: ids[0]})];
  }
  
  // get documents
  const documents = await runSqlQuery(
    // `:csv' tells pg-promise to format the ids as comma-separated values
    ` SELECT * FROM "${collection.collectionName}" WHERE _id IN ( $1:csv )`,
    [ids],
    "read"
  );

  // order documents in the same order as the ids passed as argument
  let docsByID: Record<string, ObjectsByCollectionName[N]> = {};
  documents.forEach(doc => {docsByID[doc._id] = doc});
  return ids.map(id => docsByID[id]);
};

export default findByIds;
