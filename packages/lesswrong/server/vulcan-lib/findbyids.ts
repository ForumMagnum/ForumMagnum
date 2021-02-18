
// Find by ids, for DataLoader, inspired by https://github.com/tmeasday/mongo-find-by-ids/blob/master/index.js
// EXERCISE4e: Fill in type annotations for this function
const findByIds = async (collection, ids) => {
  if (ids.length === 0) return [];
  
  if (ids.length === 1) {
    return [await collection.findOne({_id: ids[0]})];
  }
  
  // get documents
  const documents = await collection.find({ _id: { $in: ids }}).fetch();

  // order documents in the same order as the ids passed as argument
  let docsByID: any = {};
  documents.forEach(doc => {docsByID[doc._id] = doc});
  return ids.map(id => docsByID[id]);
};

export default findByIds;
