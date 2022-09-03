import { Filter, WithId } from "mongodb";

/**
 * @summary Find by ids, for DataLoader, inspired by https://github.com/tmeasday/mongo-find-by-ids/blob/master/index.js
 */
const findByIds = async <T extends DbObject>(collection: CollectionBase<T>, ids: Array<string>): Promise<Array<T|null>> => {
  if (ids.length === 0) return [];
  
  if (ids.length === 1) {
    const filter = {_id: ids[0]} as Filter<T>;
    return [await collection.findOne(filter)];
  }
  
  // get documents
  const filter = { _id: { $in: ids }} as unknown as Filter<T>;
  const documents = await collection.find(filter).fetch();

  // order documents in the same order as the ids passed as argument
  let docsByID: Record<string,T> = {};
  documents.forEach(doc => {docsByID[doc._id] = doc});
  return ids.map(id => docsByID[id]);
};

export default findByIds;
