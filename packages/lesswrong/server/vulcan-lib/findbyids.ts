import { Connectors } from './connectors';

/**
 * @summary Find by ids, for DataLoader, inspired by https://github.com/tmeasday/mongo-find-by-ids/blob/master/index.js
 */
const findByIds = async <T extends DbObject>(collection: CollectionBase<T>, ids: Array<string>, context: any): Promise<Array<T>> => {
  // get documents
  const documents = await Connectors.find(collection, { _id: { $in: ids } });

  // order documents in the same order as the ids passed as argument
  let docsByID: Record<string,T> = {};
  documents.forEach(doc => {docsByID[doc._id] = doc});
  return ids.map(id => docsByID[id]);
};

export default findByIds;
