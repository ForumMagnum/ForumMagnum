
export let expectedIndexes = {};

export async function ensureIndex(collection, index, options)
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

// Given an index partial definition for a collection's default view,
// represented as an index field-list prefix and suffix, plus an index partial
// definition for a specific view on the same collection, combine them into
// a full index definition.
//
// When defining an index prefix/suffix for a default view, every field that is
// in the selector should be in either the prefix or the suffix. If the
// selector is a simple one (a regular value), it should be in the prefix; if
// it's a complex one (an operator), it should be in the suffix. If a field
// appears twice (in both the prefix and the view-specific index, or both the
// view-specific index and the suffix), it will be included only in the first
// position where it appears.
//
//   viewFields: [ordered dictionary] Collection fields from a specific view
//   prefix: [ordered dictionary] Collection fields from the default view
//   suffix: [ordered dictionary] Collection fields from the default view
//
export function combineIndexWithDefaultViewIndex({viewFields, prefix, suffix})
{
  let combinedIndex = {...prefix};
  for (let key in viewFields) {
    if (!(key in combinedIndex))
      combinedIndex[key] = viewFields[key];
  }
  for (let key in suffix) {
    if (!(key in combinedIndex))
      combinedIndex[key] = suffix[key];
  }
  return combinedIndex;
}

export function schemaDefaultValue(defaultValue) {
  // Used for both onCreate and onUpdate
  const fillIfMissing = ({newDocument, fieldName}) => {
    if (newDocument[fieldName] === undefined) {
      return defaultValue;
    } else {
      return undefined;
    }
  };
  
  return {
    defaultValue: defaultValue,
    onCreate: fillIfMissing,
    onUpdate: fillIfMissing,
  }
}