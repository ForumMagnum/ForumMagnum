import { registerMigration, forEachBucketRangeInCollection } from './migrationUtils';
import { Revisions } from '../../lib/collections/revisions/collection';


registerMigration({
  name: "fillRevisionDraftsField",
  dateWritten: "2021-10-05",
  idempotent: true,
  action: async () => {
    await forEachBucketRangeInCollection({
      collection: Revisions,
      filter: {
        version: {$lt: "1"}, //0.x
        collectionName: {$ne: "Tags"},
      },
      fn: async (bucketSelector) => {
        await Revisions.rawUpdateMany(bucketSelector, {$set: {draft: true}}, {multi:true})
      }
    })
    await forEachBucketRangeInCollection({
      collection: Revisions,
      filter: { collectionName: "Tags", },
      fn: async (bucketSelector) => {
        await Revisions.rawUpdateMany(bucketSelector, {$set: {draft: false}}, {multi:true})
      }
    })
    await forEachBucketRangeInCollection({
      collection: Revisions,
      filter: { version: {$gte: "1"} },
      fn: async (bucketSelector) => {
        await Revisions.rawUpdateMany(bucketSelector, {$set: {draft: false}}, {multi:true})
      }
    })
  },
});
