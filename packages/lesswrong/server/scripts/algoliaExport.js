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
  console.log("Initiated Index connection", algoliaIndex)

  let importCount = 0;
  let importBatch = [];
  let batchContainer = [];
  let totalErrors = [];
  Collection.find(selector).fetch().forEach((item) => {
    if (updateFunction) updateFunction(item);
    batchContainer = Collection.toAlgolia(item);
    importBatch = [...importBatch, ...batchContainer];
    importCount++;
    if (importCount % 100 == 0) {
      //eslint-disable-next-line no-console
      console.log("Imported n documents: ",  importCount, importBatch.length)
      algoliaIndex.addObjects(_.map(importBatch, _.clone), function gotTaskID(error, content) {
        if(error) {
          //eslint-disable-next-line no-console
          console.log("Algolia Error: ", error);
          totalErrors.push(error);
        }
        //eslint-disable-next-line no-console
        console.log("write operation received: ", content);
        algoliaIndex.waitTask(content, function contentIndexed() {
          //eslint-disable-next-line no-console
          console.log("object " + content + " indexed");
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
    console.log("write operation received: " + content);
    algoliaIndex.waitTask(content, function contentIndexed() {
      //eslint-disable-next-line no-console
      console.log("object " + content + " indexed");
    });
  });
  //eslint-disable-next-line no-console
  console.log("Encountered the following errors: ", totalErrors)
}

Vulcan.runAlgoliaExport = () => {
  algoliaExport(Posts, 'test_posts', {baseScore: {$gt: 0}})
  algoliaExport(Comments, 'test_comments', {baseScore: {$gt: 0}})
  algoliaExport(Users, 'test_users')
  algoliaExport(Sequences, 'test_sequences')
}

Vulcan.runAlgoliaExportForCollection = (collectionName) => {
  if (collectionName === "Posts") {
    algoliaExport(Posts, 'test_posts', {baseScore: {$gt: 0}})
  } else if (collectionName === "Comments") {
    algoliaExport(Comments, 'test_comments', {baseScore: {$gt: 0}})
  } else if (collectionName === "Users") {
    algoliaExport(Users, 'test_users')
  } else if (collectionName === "Sequences") {
    algoliaExport(Sequences, 'test_sequences')
  }
}
