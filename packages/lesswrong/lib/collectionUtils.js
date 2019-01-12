import SimpleSchema from 'simpl-schema';

SimpleSchema.extendOptions([ 'canAutofillDefault' ]);

export let expectedIndexes = {};

// Returns true if the specified index has a name, and the collection has an
// existing index with the same name but different columns or options.
async function conflictingIndexExists(collection, index, options)
{
  if (!options.name)
    return false;
  
  let existingIndexes = await collection.rawCollection().indexes();
  
  for (let existingIndex of existingIndexes) {
    if (existingIndex.name === options.name) {
      if (!_.isEqual(existingIndex.key, index)
         || !_.isEqual(existingIndex.partialFilterExpression, options.partialFilterExpression))
      {
        return true;
      }
    }
  }
  
  return false;
}

export async function ensureIndex(collection, index, options)
{
  if (Meteor.isServer) {
    try {
      if (options.name && await conflictingIndexExists(collection, index, options)) {
        //eslint-disable-next-line no-console
        console.log(`Differing index exists with the same name: ${options.name}. Dropping.`);
        collection.rawCollection().dropIndex(options.name);
      }
      
      const mergedOptions = {background: true, ...options};
      collection._ensureIndex(index, mergedOptions);
      
      if (!expectedIndexes[collection.collectionName])
        expectedIndexes[collection.collectionName] = [];
      expectedIndexes[collection.collectionName].push({
        key: index,
        partialFilterExpression: options && options.partialFilterExpression,
      });
    } catch(e) {
      console.error(`Error in ${collection.collectionName}.ensureIndex: ${e}`);
    }
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
  const throwIfSetToNull = ({document, newDocument, fieldName}) => {
    const wasValid = (document[fieldName] !== undefined && document[fieldName] !== null);
    const isValid = (newDocument[fieldName] !== undefined && newDocument[fieldName] !== null);
    if (wasValid && !isValid) {
      throw new Error(`Error updating: ${fieldName} cannot be null or missing`);
    }
  };
  
  return {
    defaultValue: defaultValue,
    onCreate: fillIfMissing,
    onUpdate: throwIfSetToNull,
    canAutofillDefault: true,
  }
}