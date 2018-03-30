import { Posts, Comments } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import RSSFeeds from '../collections/rssfeeds/collection.js';
import Sequences from '../collections/sequences/collection.js';
import algoliasearch from 'algoliasearch';
import { getSetting } from 'meteor/vulcan:core';

function algoliaExport(Collection, indexName, selector = {}, updateFunction) {
  const algoliaAppId = getSetting('algoliaAppId');
  const algoliaAdminKey = getSetting('algoliaAdminKey');
  let client = algoliasearch(algoliaAppId, algoliaAdminKey);
  console.log(`Exporting ${indexName}...`);
  let algoliaIndex = client.initIndex(indexName);
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
      console.log("Imported n documents: ",  importCount, importBatch.length)
      algoliaIndex.addObjects(_.map(importBatch, _.clone), function gotTaskID(error, content) {
        if(error) {
          console.log("Algolia Error: ", error);
          totalErrors.push(error);
        }
        console.log("write operation received: ", content);
        algoliaIndex.waitTask(content, function contentIndexed() {
          console.log("object " + content + " indexed");
        });
      });
      importBatch = [];
    }
  })
  console.log("Exporting last n documents ", importCount);
  algoliaIndex.addObjects(_.map(importBatch, _.clone), function gotTaskID(error, content) {
    if(error) {
      console.log("Algolia Error: ", error)
    }
    console.log("write operation received: " + content);
    algoliaIndex.waitTask(content, function contentIndexed() {
      console.log("object " + content + " indexed");
    });
  });
  console.log("Encountered the following errors: ", totalErrors)
}

Vulcan.runAlgoliaExport = () => {
  algoliaExport(Posts, 'test_posts', {baseScore: {$gt: 0}})
  algoliaExport(Comments, 'test_comments', {baseScore: {$gt: 0}})
  algoliaExport(Users, 'test_users')
  algoliaExport(Sequences, 'test_sequences')
}
