import { getUnrecognizedIndexes } from '../indexUtil';
import { Vulcan, getCollection } from '../vulcan-lib';

Vulcan.printUnusedIndexes = async () =>
{
  let unrecognizedIndexes = await getUnrecognizedIndexes();
  for(let i=0; i<unrecognizedIndexes.length; i++) {
    let index = unrecognizedIndexes[i];
    //eslint-disable-next-line no-console
    console.log(JSON.stringify(index));
  }
}

Vulcan.removeObsoleteIndexes = async () =>
{
  let unrecognizedIndexes = await getUnrecognizedIndexes();
  for(let i=0; i<unrecognizedIndexes.length; i++) {
    let index = unrecognizedIndexes[i];
    let collection = getCollection(index.collectionName);
    //eslint-disable-next-line no-console
    console.log(`Dropping index on ${index.collectionName}: ${JSON.stringify(index.index)}`);
    try {
      await collection.rawCollection().dropIndex(index.index.name);
    } catch(e) {
      //eslint-disable-next-line no-console
      console.error(e);
    }
  }
};
