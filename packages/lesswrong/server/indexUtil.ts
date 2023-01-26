import { expectedIndexes } from '../lib/collectionIndexUtils'
import { isUnbackedCollection } from '../lib/collectionUtils';
import { getCollection, getAllCollections } from '../lib/vulcan-lib/getCollection';
import * as _ from 'underscore';

function indexesMatch(indexA: any, indexB: any)
{
  return (_.isEqual(indexA.key, indexB.key)
      && _.isEqual(_.keys(indexA.key), _.keys(indexB.key))
      && _.isEqual(indexA.partialFilterExpression, indexB.partialFilterExpression));
}

function isUnrecognizedIndex(collection: CollectionBase<any>, index: any)
{
  let expectedIndexesForCollection = expectedIndexes[collection.collectionName]
  if (!expectedIndexesForCollection)
    return true;
  
  if (index.name === '_id_')
    return false;
  
  for(let i=0; i<expectedIndexesForCollection.length; i++)
  {
    if (indexesMatch(expectedIndexesForCollection[i], index))
      return false;
  }
  return true;
}

// Return a list of indexes that don't correspond to an ensureIndex call
export async function getUnrecognizedIndexes()
{
  let unrecognizedIndexes: Array<any> = [];
  for(let collection of getAllCollections())
  {
    try {
      if (isUnbackedCollection(collection))
        continue;
      
      let indexes = await collection.rawCollection().indexes();
      
      indexes.forEach((index: any) => {
        if (isUnrecognizedIndex(collection, index)) {
          unrecognizedIndexes.push({
            collectionName: collection.collectionName,
            index: index,
          });
        }
      })
    } catch(e) {
      //eslint-disable-next-line no-console
      console.error(e)
    }
  }
  return unrecognizedIndexes;
}

function isMissingIndex(index: any, actualIndexes: any[])
{
  for (let actualIndex of actualIndexes)
  {
    if (indexesMatch(index, actualIndex))
      return false;
  }
  
  return true;
}

// Return a list of indexes for which an ensureIndex call was made, but the
// index isn't in the database. (This can happen if the collection has more
// than the 64 maximum indexes, or its specification is malformed in some way
// that prevents it from being created.)
export async function getMissingIndexes()
{
  let missingIndexes: Array<any> = [];

  for (let [collectionName, expectedCollectionIndexes] of Object.entries(expectedIndexes))
  {
    let collection = getCollection(collectionName as CollectionNameString);
    
    if (!collection || isUnbackedCollection(collection))
      continue;
    
    let indexes = await collection.rawCollection().indexes();
    
    for (let expectedIndex of expectedCollectionIndexes) {
      if (isMissingIndex(expectedIndex, indexes)) {
        missingIndexes.push({
          collectionName: collectionName,
          index: expectedIndex
        });
      }
    }
  }
  
  return missingIndexes;
}
