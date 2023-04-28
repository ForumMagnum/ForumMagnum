import { postStatuses } from "../../lib/collections/posts/constants";
import type { AlgoliaIndexCollectionName } from "../../lib/search/algoliaUtil";

export const getAlgoliaFilter = (collectionName: AlgoliaIndexCollectionName) => {
  switch (collectionName) {
    case 'Posts':
     return {
       baseScore: {$gte: 0},
       draft: {$ne: true},
       status: postStatuses.STATUS_APPROVED,
     };
    case 'Comments':
      return {baseScore: {$gt: 0}, deleted: {$ne: true}};
    case 'Users':
      return {deleted: {$ne: true}, deleteContent: {$ne: true}};
    case 'Sequences':
      return {isDeleted: {$ne: true}, draft: {$ne: true}, hidden: {$ne: true}};
    case 'Tags':
      return {deleted: {$ne: true}, adminOnly: {$ne: true}};
    default:
      throw new Error(`Did not recognize collectionName: ${collectionName}`);
  }
}
