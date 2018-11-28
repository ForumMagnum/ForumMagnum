
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
