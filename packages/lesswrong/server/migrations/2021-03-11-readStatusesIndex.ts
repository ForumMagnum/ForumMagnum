import { registerMigration } from './migrationUtils';
import { ReadStatuses } from '../../lib/collections/readStatus/collection';
import { ensureIndexAsync } from '../../lib/collectionIndexUtils'
import groupBy from 'lodash/groupBy';
import maxBy from 'lodash/maxBy';
import filter from 'lodash/filter';

// In mongodb, upserts are not atomic unless there is a unique index on the
// upsert keys. We use upserts on the ReadStatuses collection so that there's
// only one last-read-date for each user-post pair. Which doesn't work, because
// we didn't have the unique index. @#$@#ing mongodb. So now we need to (a)
// clear out all the duplicate entries, and (b) create the index.
//
// Unfortunately, if any dupilcate entries are created during the index build,
// then the index build will fail. Fortunately the index build is quick and only
// a small fraction of views cause duplicate entries, so this will probably
// work on the first try, and if it doesn't you can just retry it.

registerMigration({
  name: "readStatusesIndex",
  dateWritten: "2021-03-11",
  idempotent: true,
  action: async () => {
    // Ensure that the tagId field is not missing (ie replace missing with null)
    await ReadStatuses.rawUpdateMany({tagId: {$exists: false}}, {$set: {tagId: null}}, {multi: true})
    
    // Download all ReadStatuses, and identify the duplicates
    const allReadStatuses = await ReadStatuses.find().fetch();
    const idsToRemove: Array<string> = [];
    
    const postReadStatuses = filter(allReadStatuses, s => !!s.postId)
    
    const postReadStatusesGrouped = groupBy(postReadStatuses, readStatus => `${readStatus.userId}_${readStatus.postId}}`);
    for (let key of Object.keys(postReadStatusesGrouped)) {
      const group = postReadStatusesGrouped[key]!;
      if (group.length > 1) {
        const lastReadDate = maxBy(group, readStatus => readStatus.lastUpdated)!.lastUpdated;
        const rowsToDelete = filter(group, readStatus => readStatus.lastUpdated !== lastReadDate);
        for (let row of rowsToDelete)
          idsToRemove.push(row._id);
      }
    }
    
    // eslint-disable-next-line no-console
    console.log(`${idsToRemove.length} duplicate read status entries found`);
    
    // Remove duplicate read statuses, then add index to prevent them in the future
    await ReadStatuses.rawRemove({_id: {$in: idsToRemove}});
    await ensureIndexAsync(ReadStatuses, {userId:1, postId:1, tagId:1}, {unique: true})
  }
})
