import { expectedIndexes } from '../../lib/collectionUtils';
import { Collections } from 'meteor/vulcan:lib';

export function isUnrecognizedIndex(collection, index)
{
  let expectedIndexesForCollection = expectedIndexes[collection.collectionName]
  
  if (index.name === '_id_')
    return false;
  
  for(let i=0; i<expectedIndexesForCollection.length; i++)
  {
    if (_.isEqual(expectedIndexesForCollection[i].key, index.key)
        && _.isEqual(_.keys(expectedIndexesForCollection[i].key), _.keys(index.key))
        && _.isEqual(expectedIndexesForCollection[i].partialFilterExpression, index.partialFilterExpression))
    {
      return false;
    }
  }
  return true;
}

export async function getUnrecognizedIndexes()
{
  let unrecognizedIndexes = [];
  for(let i=0; i<Collections.length; i++)
  {
    try {
      let collection = Collections[i];
      
      if (collection.collectionName === 'Settings' || collection.collectionName === 'Callbacks') {
        // Vulcan collections with no backing database table
        continue;
      }
      
      console.log("Checking for unrecognized indexes on "+collection.collectionName);
      let indexes = await collection.rawCollection().indexes();
      console.log("Checking "+indexes.length+" indexes");
      
      indexes.forEach(index => {
        if (isUnrecognizedIndex(collection, index)) {
          unrecognizedIndexes.push({
            collectionName: collection.collectionName,
            index: index,
          });
        }
      })
    } catch(e) {
      console.error(e)
    }
  }
  return unrecognizedIndexes;
}

Vulcan.printUnusedIndexes = async () =>
{
  let unrecognizedIndexes = await getUnrecognizedIndexes();
  for(let i=0; i<unrecognizedIndexes.length; i++) {
    let index = unrecognizedIndexes[i];
    console.log(JSON.stringify(index));
  }
}

Vulcan.removeObsoleteIndexes = async () =>
{
  let unrecognizedIndexes = await getUnrecognizedIndexes();
  for(let i=0; i<unrecognizedIndexes.length; i++) {
    let index = unrecognizedIndexes[i];
    let collection = _.find(Collections, c => c.collectionName === index.collectionName);
    console.log(`Dropping index on ${index.collectionName}: ${JSON.stringify(index.index)}`);
    try {
      await collection.rawCollection().dropIndex(index.index.name);
    } catch(e) {
      console.error(e);
    }
  }
};