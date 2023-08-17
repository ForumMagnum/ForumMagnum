import { runSqlQuery } from "../../lib/sql/sqlClient";

/**
 * @summary Find by ids, for DataLoader, inspired by https://github.com/tmeasday/mongo-find-by-ids/blob/master/index.js
 */
const findByIds = async <T extends DbObject>(collection: CollectionBase<T>, ids: Array<string>): Promise<Array<T|null>> => {
  if (ids.length === 0) return [];
  
  if (ids.length === 1) {
    return [await collection.findOne({_id: ids[0]})];
  }
  
  // get documents
  const documents = collection.isPostgres()
    ? await runSqlQuery(
        // `:csv' tells pg-promise to format the ids as comma-separated values
        ` SELECT * FROM "${collection.collectionName}" WHERE _id IN ( $1:csv )`,
        [ids],
        "read"
      )
    : await collection.find({ _id: { $in: ids }}).fetch();

  // order documents in the same order as the ids passed as argument
  let docsByID: Record<string,T> = {};
  documents.forEach(doc => {docsByID[doc._id] = doc});
  return ids.map(id => docsByID[id]);
};

export default findByIds;
