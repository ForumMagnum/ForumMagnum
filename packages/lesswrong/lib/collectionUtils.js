
export function ensureIndex(collection, index, options)
{
  if (Meteor.isServer) {
    collection._ensureIndex(index, options);
  }
}
