
export let expectedIndexes = {};

export function ensureIndex(collection, index, options)
{
  if (Meteor.isServer) {
    const mergedOptions = {background: true, ...options};
    collection._ensureIndex(index, mergedOptions);
    
    if (!expectedIndexes[collection.collectionName])
      expectedIndexes[collection.collectionName] = [];
    expectedIndexes[collection.collectionName].push({
      key: index,
      partialFilterExpression: options && options.partialFilterExpression,
    });
  }
}

export function removeObsoleteIndexes(collection, indexes)
{
  if (Meteor.isServer) {
    try {
      for(let i=0; i<indexes.length; i++)
        collection._dropIndex(indexes[i]);
    } catch(e) {
      // Swallow exception, to make this idempotent
    }
  }
}