
export function ensureIndex(collection, index, options)
{
  if (Meteor.isServer) {
    const mergedOptions = {background: true, ...options};
    collection._ensureIndex(index, mergedOptions);
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