import moment from '../lib/moment-timezone';
import { compile as compileHtmlToText } from 'html-to-text'
import sumBy from 'lodash/sumBy';
import type {
  KarmaChangesArgs,
  AnyKarmaChange,
} from './collections/users/karmaChangesGraphQL';
import { isFriendlyUI } from '../themes/forumTheme';
import type VotesRepo from './repos/VotesRepo';
import { karmaChangeNotifierDefaultSettings, KarmaChangeSettingsType, KarmaChangeUpdateFrequency } from '@/lib/collections/users/helpers';

// Use html-to-text's compile() wrapper (baking in the default options) to make it faster when called repeatedly
const htmlToTextDefault = compileHtmlToText();

const COMMENT_DESCRIPTION_LENGTH = 500;

const isPostKarmaChange = (change: AnyKarmaChange): change is PostKarmaChange =>
  "title" in change && !!change.title;

const isCommentKarmaChange = (change: AnyKarmaChange): change is CommentKarmaChange =>
  "tagCommentType" in change && !!change.tagCommentType;

/**
 * Given an array of karma changes on an account's content,
 * calculates the total karma change for that account,
 * and splits the karma changes into buckets by content type.
 *
 * Takes an optional _id suffix to separately identify these changes.
 */
const categorizeKarmaChanges = (changes: AnyKarmaChange[], suffix?: string): KarmaChangesSimple & {totalChange: number} => {
  const posts: PostKarmaChange[] = [];
  const comments: CommentKarmaChange[] = [];
  const tagRevisions: RevisionsKarmaChange[] = [];
  let totalChange = 0;

  for (const change of changes) {
    totalChange += change.scoreChange;
    if (suffix) {
      change._id += suffix
    }
    if (isPostKarmaChange(change)) {
      posts.push(change);
    } else if (isCommentKarmaChange(change)) {
      comments.push({
        ...change,
        description: htmlToTextDefault(change.description ?? "")
          .substring(0, COMMENT_DESCRIPTION_LENGTH),
      });
    } else { // This is a TagRevisionKarmaChange
      tagRevisions.push(change);
    }
  }
  
  return {
    totalChange, posts, comments, tagRevisions
  }
}

const getEAKarmaChanges = async (
  votesRepo: VotesRepo,
  args: KarmaChangesArgs,
  nextBatchDate: Date|null,
  updateFrequency: KarmaChangeUpdateFrequency,
): Promise<KarmaChanges> => {
  const changes = await votesRepo.getEAKarmaChanges(args);
  const newChanges = categorizeKarmaChanges(changes)
  
  // We also display the rest of the karma changes that they got
  // in the past 24 hours and in the past week underneath
  // the ones they got since the last time they checked.
  // This reduces the chance that they lose the changes after viewing them once.

  let todaysKarmaChanges: KarmaChangesSimple|null = null;
  const yesterday = moment().subtract(1, 'day').toDate()
  // "Today" is only relevant for realtime notifications.
  if (updateFrequency === 'realtime' && args.startDate > yesterday) {
    const todaysChanges = await votesRepo.getEAKarmaChanges({
      ...args,
      startDate: yesterday,
      endDate: args.startDate,
    })
    todaysKarmaChanges = categorizeKarmaChanges(todaysChanges, '-today')
  }

  let thisWeeksKarmaChanges: KarmaChangesSimple|null = null;
  const lastWeek = moment().subtract(1, 'week').toDate()
  // "This week" is only relevant for realtime and daily notifications.
  if (['realtime', 'daily'].includes(updateFrequency) && args.startDate > lastWeek) {
    const thisWeeksChanges = await votesRepo.getEAKarmaChanges({
      ...args,
      startDate: lastWeek,
      endDate: !!todaysKarmaChanges ? yesterday : args.startDate,
    })
    thisWeeksKarmaChanges = categorizeKarmaChanges(thisWeeksChanges, '-thisWeek')
  }

  return {
    totalChange: newChanges.totalChange,
    startDate: args.startDate,
    endDate: args.endDate,
    nextBatchDate,
    updateFrequency,
    posts: newChanges.posts,
    comments: newChanges.comments,
    tagRevisions: newChanges.tagRevisions,
    todaysKarmaChanges,
    thisWeeksKarmaChanges,
  };
}

/**
 * The the amount of time between two dates to at-most `maxDays` days.
 * `endDate` is always unchanged, and if the number of days is greater than
 * `maxDays` the `startDate` will be pulled closer.
 */
const limitDateRange = ({startDate, endDate, maxDays}: {
  startDate: Date,
  endDate: Date,
  maxDays: number,
}): {
  startDate: Date,
  endDate: Date,
} => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const maxDelta = maxDays * 24 * 60 * 60 * 1000;
  return {
    startDate: new Date(Math.max(start, end - maxDelta)),
    endDate,
  };
};

// Given a user and a date range, get a summary of karma changes that occurred
// during that date range.
//
// For example:
// {
//   totalChange: 10,
//   startDate: Date("2018-09-09"),
//   endDate: Date("2018-09-10"),
//   documents: [
//     {
//       _id: "12345",
//       collectionName: "Posts",
//       scoreChange: 3,
//     },
//     {
//       _id: "12345",
//       collectionName: "Comments",
//       scoreChange: -1,
//     },
//   ]
// }
export const getKarmaChanges = async ({user, startDate, endDate, nextBatchDate=null, af=false, context}: {
  user: DbUser,
  startDate: Date,
  endDate: Date,
  nextBatchDate?: Date|null,
  af?: boolean,
  context: ResolverContext,
}): Promise<KarmaChanges> => {
  if (!user) throw new Error("Missing required argument: user");
  if (!startDate) throw new Error("Missing required argument: startDate");
  if (!endDate) throw new Error("Missing required argument: endDate");
  if (startDate > endDate)
    throw new Error("getKarmaChanges: endDate must be after startDate");

  const {showNegativeKarma, updateFrequency} = user.karmaChangeNotifierSettings ??
    karmaChangeNotifierDefaultSettings.get();

  const votesRepo = context.repos.votes;
  const queryArgs: KarmaChangesArgs = {
    userId: user._id,
    startDate,
    endDate,
    af,
    showNegative: showNegativeKarma,
  };

  if (isFriendlyUI) {
    const args = {
      ...queryArgs,
      ...limitDateRange({...queryArgs, maxDays: 40}),
    };
    return getEAKarmaChanges(votesRepo, args, nextBatchDate, updateFrequency);
  }

  const { changedComments, changedPosts, changedTagRevisions } = await votesRepo.getLWKarmaChanges(queryArgs);

  // Replace comment bodies with abbreviated plain-text versions (rather than
  // HTML).
  for (let comment of changedComments) {
    comment.description = htmlToTextDefault(comment.description ?? "")
      .substring(0, COMMENT_DESCRIPTION_LENGTH);
  }

  // Fill in tag references
  const tagIdsReferenced = new Set<string>();
  for (let changedComment of changedComments) {
    if (changedComment.tagId)
      tagIdsReferenced.add(changedComment.tagId);
  }
  for (let changedTagRevision of changedTagRevisions) {
    if (changedTagRevision.tagId)
      tagIdsReferenced.add(changedTagRevision.tagId);
  }
  
  const tagIdToMetadata = await mapTagIdsToMetadata([...tagIdsReferenced.keys()], context)
  for (let changedComment of changedComments) {
    if (changedComment.tagId) {
      changedComment.tagSlug = tagIdToMetadata[changedComment.tagId].slug;
    }
  }
  for (let changedRevision of changedTagRevisions) {
    if (changedRevision.tagId) {
      changedRevision.tagSlug = tagIdToMetadata[changedRevision.tagId].slug;
      changedRevision.tagName = tagIdToMetadata[changedRevision.tagId].name;
    }
  }
  
  
  let totalChange =
      sumBy(changedPosts, (doc: any)=>doc.scoreChange)
    + sumBy(changedComments, (doc: any)=>doc.scoreChange)
    + sumBy(changedTagRevisions, (doc: any)=>doc.scoreChange);
  
  return {
    totalChange,
    startDate,
    endDate,
    nextBatchDate,
    updateFrequency,
    posts: changedPosts,
    comments: changedComments,
    tagRevisions: changedTagRevisions,
    todaysKarmaChanges: null,
    thisWeeksKarmaChanges: null,
  };
}

const mapTagIdsToMetadata = async (tagIds: Array<string>, context: ResolverContext): Promise<Record<string,{slug: string, name: string}>> => {
  const { Tags, loaders } = context;
  const mapping: Record<string,{slug: string, name: string}> = {};
  await Promise.all(tagIds.map(async (tagId: string) => {
    const tag = context
      ? await loaders.Tags.load(tagId)
      : await Tags.findOne(tagId)
    if (tag?.slug) {
      mapping[tagId] = {
        slug: tag.slug,
        name: tag.name
      };
    }
  }));
  return mapping;
}

export function getKarmaChangeDateRange({settings, now, lastOpened=null, lastBatchStart=null}: {
  settings: any,
  now: Date,
  lastOpened?: Date|null,
  lastBatchStart?: Date|null,
}): null|{start: any, end: any}
{
  // Greatest date prior to lastOpened at which the time of day matches
  // settings.timeOfDay.
  let todaysDailyReset = moment(now).tz("GMT");
  todaysDailyReset.set('hour', Math.floor(settings.timeOfDayGMT));
  todaysDailyReset.set('minute', 60*(settings.timeOfDayGMT%1));
  todaysDailyReset.set('second', 0);
  todaysDailyReset.set('millisecond', 0);
  
  const lastDailyReset = todaysDailyReset.isAfter(now)
    ? moment(todaysDailyReset).subtract(1, 'days')
    : todaysDailyReset;

  const previousBatchExists = !!lastBatchStart
  
  switch(settings.updateFrequency) {
    default:
    case "disabled":
      return null;
    case "daily": {
      const oneDayPrior = moment(lastDailyReset).subtract(1, 'days')
      
      // Check whether the last time you opened the menu was in the same batch-period
      const openedBeforeNextBatch = lastOpened && lastOpened >= lastDailyReset.toDate()

      // If you open the notification menu again before the next batch has started, just return
      // the previous batch
      if (previousBatchExists && openedBeforeNextBatch) {
        // Since we know that we reopened the notifications before the next batch, the last batch
        // will have ended at the last daily reset time
        const lastBatchEnd = lastDailyReset
        // Sanity check in case lastBatchStart is invalid (eg not cleared after a settings change)
        if (lastBatchStart! < lastBatchEnd.toDate()) {
          return {
            start: lastBatchStart,
            end: lastBatchEnd.toDate()
          };
        }
      }

      // If you've never opened the menu before, then return the last daily batch, else
      // create batch for all periods that happened since you last opened it
      const startDate = lastOpened ? moment.min(oneDayPrior, moment(lastOpened)) : oneDayPrior
      return {
        start: startDate.toDate(),
        end: lastDailyReset.toDate(),
      };
    }
    case "weekly": {
      // Target day of the week, as an integer 0-6
      const targetDayOfWeekNum = moment().day(settings.dayOfWeekGMT).day();
      const lastDailyResetDayOfWeekNum = lastDailyReset.day();
      
      // Number of days back from today's daily reset to get to a daily reset
      // of the correct day of the week
      const daysOfWeekDifference = ((lastDailyResetDayOfWeekNum - targetDayOfWeekNum) + 7) % 7;
      
      const lastWeeklyReset = moment(lastDailyReset).subtract(daysOfWeekDifference, 'days');
      const oneWeekPrior = moment(lastWeeklyReset).subtract(7, 'days');

      // Check whether the last time you opened the menu was in the same batch-period
      const openedBeforeNextBatch = lastOpened && lastOpened >= lastWeeklyReset.toDate()

      // If you open the notification menu again before the next batch has started, just return
      // the previous batch
      if (previousBatchExists && openedBeforeNextBatch) {
        // Since we know that we reopened the notifications before the next batch, the last batch
        // will have ended at the last daily reset time
        const lastBatchEnd = lastWeeklyReset
        // Sanity check in case lastBatchStart is invalid (eg not cleared after a settings change)
        if (lastBatchStart! < lastBatchEnd.toDate()) {
          return {
            start: lastBatchStart,
            end: lastBatchEnd.toDate()
          };
        }
      }

      // If you've never opened the menu before, then return the last daily batch, else
      // create batch for all periods that happened since you last opened it
      const startDate = lastOpened ? moment.min(oneWeekPrior, moment(lastOpened)) : oneWeekPrior
      return {
        start: startDate.toDate(),
        end: lastWeeklyReset.toDate(),
      };
    }
    case "realtime":
      if (!lastOpened) {
        // If set to realtime and never opened before (eg, you just changed the
        // setting), default to the last 24 hours.
        return {
          start: moment().subtract(1, 'days').toDate(),
          end: now
        }
      } else {
        return {
          start: lastOpened,
          end: now
        }
      }
  }
}

export function getKarmaChangeNextBatchDate({settings, now}: {
  settings: KarmaChangeSettingsType,
  now: Date,
})
{
  switch(settings.updateFrequency) {
    case "disabled":
    case "realtime":
      return null;
    case "daily":
      const lastDailyBatch = getKarmaChangeDateRange({settings, now});
      const lastDailyReset = lastDailyBatch!.end;
      const nextDailyReset = moment(lastDailyReset).add(1, 'days');
      return nextDailyReset.toDate();
      
    case "weekly":
      const lastWeeklyBatch = getKarmaChangeDateRange({settings, now});
      const lastWeeklyReset = lastWeeklyBatch!.end;
      const nextWeeklyReset = moment(lastWeeklyReset).add(7, 'days');
      return nextWeeklyReset.toDate();
  }
}
