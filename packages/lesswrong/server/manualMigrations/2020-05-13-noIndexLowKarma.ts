import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';
import { postStatuses } from '../../lib/collections/posts/constants';
import moment from 'moment'
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

export const LOW_KARMA_THRESHOLD = 5

const dateFormat = 'YYYY-MM-DD'
const launchDateByForum: ForumOptions<string> = {
  LessWrong: 'TODO', // lw-look-here
  AlignmentForum: "Don't",
  EAForum: '2014-09-10',
  default: "ahhhhh",
}
const launchDate = forumSelect(launchDateByForum)

export function makeLowKarmaSelector (karmaThreshold: number): MongoSelector<DbPost> {
  return {
    postedAt: {
      $gt: moment.utc(launchDate).toDate(),
      $lt: moment.utc().subtract(1, 'year').toDate()
    },
    isEvent: {$ne: true},
    isFuture: false,
    draft: false,
    baseScore: {$lt: karmaThreshold},
    status: postStatuses.STATUS_APPROVED, // Others are not shown
  }
}

registerMigration({
  name: "noIndexLowKarma",
  dateWritten: "2020-05-13",
  idempotent: true,
  action: async () => {
    if (!moment(launchDate, dateFormat, true).isValid()) {
      throw new Error('Need to specify launch date for this forum')
    }
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      filter: makeLowKarmaSelector(LOW_KARMA_THRESHOLD),
      callback: async (posts: Array<DbPost>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating post batch");
        const changes = posts.map(post => ({
          updateOne: {
            filter: { _id: post._id },
            update: {$set: {noIndex: true}}
          }
        }))
        await Posts.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
