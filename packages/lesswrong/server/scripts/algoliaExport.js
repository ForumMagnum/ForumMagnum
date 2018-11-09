/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import Sequences from '../../lib/collections/sequences/collection.js';
import algoliasearch from 'algoliasearch';
import { getSetting } from 'meteor/vulcan:core';

function algoliaExport(Collection, indexName, selector = {}, updateFunction) {
  const algoliaAppId = getSetting('algolia.appId');
  const algoliaAdminKey = getSetting('algolia.adminKey');
  let client = algoliasearch(algoliaAppId, algoliaAdminKey);
  //eslint-disable-next-line no-console
  console.log(`Exporting ${indexName}...`);
  let algoliaIndex = client.initIndex(indexName);
  //eslint-disable-next-line no-console
  console.log("Initiated Index connection") //, algoliaIndex)

  let importCount = 0;
  let importBatch = [];
  let batchContainer = [];
  let totalErrors = [];
  const collectionArray = Collection.find(selector).fetch()
  const numItems = collectionArray.length
  console.log(`Beginning to import ${numItems} ${Collection._name}`)
  collectionArray.forEach((item) => {
    if (updateFunction) updateFunction(item);
    batchContainer = Collection.toAlgolia(item);
    importBatch = [...importBatch, ...batchContainer];
    importCount++;
    if (importCount % 100 == 0) {
      //eslint-disable-next-line no-console
      console.log("Imported n documents: ",  importCount, importBatch.length, numItems)
      // TODO oh come on this could be dry-er
      algoliaIndex.addObjects(_.map(importBatch, _.clone), function gotTaskID(error, content) {
        if(error) {
          //eslint-disable-next-line no-console
          console.log("Algolia Error: ", error);
          totalErrors.push(error);
        }
        //eslint-disable-next-line no-console
        // console.log("write operation received: ", content);
        algoliaIndex.waitTask(content, function contentIndexed() {
          //eslint-disable-next-line no-console
          // console.log("object " + content + " indexed");
        });
      });
      importBatch = [];
    }
  })
  //eslint-disable-next-line no-console
  console.log("Exporting last n documents ", importCount);
  algoliaIndex.addObjects(_.map(importBatch, _.clone), function gotTaskID(error, content) {
    if(error) {
      //eslint-disable-next-line no-console
      console.error("Algolia Error: ", error)
    }
    //eslint-disable-next-line no-console
    // console.log("write operation received: " + content);
    algoliaIndex.waitTask(content, function contentIndexed() {
      //eslint-disable-next-line no-console
      // console.log("object " + content + " indexed");
    });
  });
  //eslint-disable-next-line no-console
  console.log("Encountered the following errors: ", totalErrors)
}

Vulcan.runAlgoliaExport = () => {
  // algoliaExport(Posts, 'test_posts', {baseScore: {$gt: 0}, draft: {$ne: true}})
  // algoliaExport(Comments, 'test_comments', {baseScore: {$gt: 0}, isDeleted: {$ne: true}})
  algoliaExport(Users, 'test_users', {deleted: {$ne: true}})
  // algoliaExport(Sequences, 'test_sequences')
  console.log('Finished algolia export')
}
