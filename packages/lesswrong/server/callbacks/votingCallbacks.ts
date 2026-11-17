import moment from 'moment';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import sumBy from 'lodash/sumBy';
import Notifications from '../../server/collections/notifications/collection';
import Users from '../../server/collections/users/collection';
import { reviewMarketCreationMinimumKarmaSetting } from '../../lib/instanceSettings';
import type { VoteDocTuple } from '../../lib/voting/vote';
import { userSmallVotePower } from '../../lib/voting/voteTypes';
import { createNotification } from '../notificationCallbacksHelpers';
import { checkForStricterRateLimits } from '../rateLimitUtils';
import { batchUpdateScore } from '../updateScores';
import { triggerCommentAutomodIfNeeded } from "./sunshineCallbackUtils";
import { isProduction } from '../../lib/executionEnvironment';
import { postGetAbsolutePageUrl } from '../../lib/collections/posts/helpers';
import { createManifoldMarket } from '../../lib/collections/posts/annualReviewMarkets';
import { revokeUserAFKarmaForCancelledVote, grantUserAFKarmaForVote } from './alignment-forum/callbacks';
import { tagGetAbsoluteUrl } from '@/lib/collections/tags/helpers';
import { updatePostDenormalizedTags } from '../tagging/helpers';
import { recomputeContributorScoresFor } from '../utils/contributorsUtil';
import { userGetGroups } from '@/lib/vulcan-users/permissions';
import { MODERATE_OWN_PERSONAL_KARMA_THRESHOLD, TRUSTLEVEL1_KARMA_THRESHOLD } from '@/lib/collections/users/helpers';
import { backgroundTask } from '../utils/backgroundTask';
import { maybeEvaluateTypoReacts } from './typoSuggestionCallbacks';
import { maybeNotifyMessageReaction } from './messageReactionCallbacks';

async function updateTrustedStatus({newDocument, vote}: VoteDocTuple, context: ResolverContext) {
  const { Users } = context;

  const user = await Users.findOne(newDocument.userId)
  if (user && (user?.karma) >= TRUSTLEVEL1_KARMA_THRESHOLD && (!userGetGroups(user).includes('trustLevel1'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser?.username, updatedUser?._id, updatedUser?.karma, updatedUser?.groups)
  }
}

async function updateModerateOwnPersonal({newDocument, vote}: VoteDocTuple, context: ResolverContext) {
  const { Users } = context;
  
  const user = await Users.findOne(newDocument.userId)
  if (!user) throw Error("Couldn't find user")
  if ((user.karma) >= MODERATE_OWN_PERSONAL_KARMA_THRESHOLD && (!userGetGroups(user).includes('canModeratePersonal'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'canModeratePersonal'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    if (!updatedUser) throw Error("Couldn't find user to update")
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
}

async function increaseMaxBaseScore({newDocument, vote}: VoteDocTuple, context: ResolverContext) {
  const { Posts } = context;

  if (vote.collectionName === "Posts") {
    const post = newDocument as DbPost;
    if (post.baseScore > (post.maxBaseScore || 0)) {
      let thresholdTimestamp: any = {};
      if (!post.scoreExceeded2Date && post.baseScore >= 2) {
        thresholdTimestamp.scoreExceeded2Date = new Date();
      }
      if (!post.scoreExceeded30Date && post.baseScore >= 30) {
        thresholdTimestamp.scoreExceeded30Date = new Date();
      }
      if (!post.scoreExceeded45Date && post.baseScore >= 45) {
        thresholdTimestamp.scoreExceeded45Date = new Date();
      }
      if (!post.scoreExceeded75Date && post.baseScore >= 75) {
        thresholdTimestamp.scoreExceeded75Date = new Date();
      }
      if (!post.scoreExceeded125Date && post.baseScore >= 125) {
        thresholdTimestamp.scoreExceeded125Date = new Date();
      }
      if (!post.scoreExceeded200Date && post.baseScore >= 200) {
        thresholdTimestamp.scoreExceeded200Date = new Date();
      }
      await Posts.rawUpdateOne({_id: post._id}, {$set: {maxBaseScore: post.baseScore, ...thresholdTimestamp}})
    }
  }
}

function voteUpdatePostDenormalizedTags({newDocument}: {newDocument: VoteableType}) {
  let postId: string;
  if ("postId" in newDocument) { // is a tagRel
    // Applying human knowledge here
    postId = (newDocument as DbTagRel)["postId"];
  } else if ("tagRelevance" in newDocument) { // is a post
    postId = newDocument["_id"];
  } else {
    return;
  }
  backgroundTask(updatePostDenormalizedTags(postId));
}

/**
 * The users whose karma a vote counts towards: the authors of what it's on,
 * unless it was cast by one of them, so that authors can't give themselves or
 * each other karma. `authorIds` is as of when the vote was cast, so cancelling
 * a vote takes karma from the same users who were given it.
 */
function getUsersGivenKarmaByVote(vote: DbVote): string[] {
  const authorIds = vote.authorIds ?? [];
  const affectsKarma = !authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName);
  return affectsKarma ? authorIds : [];
}

export interface VoteChange {
  newDocument: DbVoteableType
  castVote?: DbVote
  cancelledVotes: DbVote[]
}

/**
 * Applies a change to the votes on a document to its authors' karma. Runs in
 * the same transaction as the change, unlike `onCastVoteAsync` and
 * `onVoteCancel`.
 */
export async function updateKarmaForVoteChange({ newDocument, castVote, cancelledVotes }: VoteChange) {
  const votePowerChanges = [
    ...(castVote ? [{ vote: castVote, power: castVote.power }] : []),
    ...cancelledVotes.map((vote) => ({ vote, power: -vote.power })),
  ];
  const karmaChanges = votePowerChanges.flatMap(({ vote, power }) =>
    getUsersGivenKarmaByVote(vote).map((userId) => ({ userId, power }))
  );
  const karmaChangeByUserId = mapValues(
    groupBy(karmaChanges, ({ userId }) => userId),
    (userKarmaChanges) => sumBy(userKarmaChanges, ({ power }) => power),
  );

  // One user at a time, in the same order every time. Two transactions that
  // updated the same users in different orders could each be left waiting for
  // a row that the other had locked.
  for (const userId of Object.keys(karmaChangeByUserId).sort()) {
    const karmaChange = karmaChangeByUserId[userId];
    if (karmaChange !== 0) {
      await Users.rawUpdateOne({_id: userId}, {$inc: {karma: karmaChange}});
    }
  }

  for (const vote of cancelledVotes) {
    await revokeUserAFKarmaForCancelledVote({newDocument, vote});
  }
  if (castVote) {
    await grantUserAFKarmaForVote({newDocument, vote: castVote});
  }
}

export async function onVoteCancel(newDocument: DbVoteableType, vote: DbVote, context: ResolverContext): Promise<void> {
  voteUpdatePostDenormalizedTags({newDocument});
  backgroundTask(cancelVoteCount({newDocument, vote}));

  if (vote.collectionName === "Revisions") {
    const rev = (newDocument as DbRevision);
    if (rev.collectionName === "Tags" || rev.collectionName === "MultiDocuments") {
      await recomputeContributorScoresFor(newDocument as DbRevision, context);
    }
  }
}

export async function onCastVoteAsync(voteDocTuple: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext): Promise<void> {
  backgroundTask(updateTrustedStatus(voteDocTuple, context));
  backgroundTask(updateModerateOwnPersonal(voteDocTuple, context));
  backgroundTask(increaseMaxBaseScore(voteDocTuple, context));
  voteUpdatePostDenormalizedTags(voteDocTuple);

  const { vote, newDocument } = voteDocTuple;
  if (vote.collectionName === "Revisions") {
    const rev = (newDocument as DbRevision);
    if (rev.collectionName === "Tags" || rev.collectionName === "MultiDocuments") {
      await recomputeContributorScoresFor(newDocument as DbRevision, context);
    }
  }

  backgroundTask(onAuthorKarmaGranted(voteDocTuple, context));
  backgroundTask(incVoteCount(voteDocTuple));
  backgroundTask(checkAutomod(voteDocTuple, collection, user, context));
  backgroundTask(maybeEvaluateTypoReacts(voteDocTuple, context));
  backgroundTask(maybeNotifyMessageReaction(voteDocTuple, context));
  await maybeCreateReviewMarket(voteDocTuple, collection, user, context);
}

export const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]

function votesCanTriggerReview(content: DbPost | DbComment) {
  const sixMonthsAgo = moment().subtract(6, 'months');
  return moment(content.postedAt).isAfter(sixMonthsAgo);
}

async function onAuthorKarmaGranted({newDocument, vote}: VoteDocTuple, context: ResolverContext) {
  const authorIds = getUsersGivenKarmaByVote(vote);
  if (authorIds.length && newDocument.userId) {
    const authors = await Users.find({_id: {$in: authorIds}}).fetch();
    for (const author of authors) {
      const newKarma = author.karma;
      const oldKarma = newKarma - vote.power;
      backgroundTask(userKarmaChangedFrom(newDocument.userId, oldKarma, newKarma, context));
    }
  }

  if (!!newDocument.userId && ['Posts', 'Comments'].includes(vote.collectionName) && votesCanTriggerReview(newDocument as DbPost | DbComment)) {
    backgroundTask(checkForStricterRateLimits(newDocument.userId, newDocument._id, vote.collectionName, context));
  }
}

async function userKarmaChangedFrom(userId: string, oldKarma: number, newKarma: number, context: ResolverContext) {
  if (userSmallVotePower(oldKarma, 1) < userSmallVotePower(newKarma, 1)) {
    const yesterday = moment().subtract(1, 'days').toDate();
    const existingNotificationCount = await Notifications.find({userId, type: 'karmaPowersGained', createdAt: {$gt: yesterday}}).count();
    if (existingNotificationCount === 0) {
      await createNotification({
        userId,
        notificationType: 'karmaPowersGained',
        documentType: null,
        documentId: null,
        context
      })
    }
  }
};

async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  // Increment the count for the person casting the vote
  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    backgroundTask(Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: 1, voteCount: 1}}));
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    backgroundTask(Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: 1, voteReceivedCount: 1}}));
  }
}

async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    backgroundTask(Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: -1, voteCount: -1}}));
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    backgroundTask(Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: -1, voteReceivedCount: -1}}));
  }
}

async function checkAutomod ({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {
  if (vote.collectionName === 'Comments') {
    backgroundTask(triggerCommentAutomodIfNeeded(newDocument, vote, context.forumType));
  }
}


export async function updateScoreOnPostPublish(publishedPost: DbPost, context: ResolverContext) {
  const { Posts } = context;

  // When a post is published (undrafted), update its score. (That is, recompute
  // the time-decaying score used for sorting, since the time that's computed
  // relative to has just changed).
  //
  // To do this, we mark it `inactive:false` and update the scores on the
  // whole collection. (This is already something being done frequently by a
  // cronjob.)
  if (publishedPost.inactive) {
    await Posts.rawUpdateOne({_id: publishedPost._id}, {$set: {inactive: false}});
  }
  
  await batchUpdateScore({collection: Posts});
}

// When a vote is cast, if its new karma is above review_market_threshold, create a Manifold
// on it making top 50 in the review, and create a comment linking to the market.

// async function addTagToPost(postId: string, tagSlug: string, botUser: DbUser, context: ResolverContext) {
//   const tag = await Tags.findOne({slug: tagSlug})
//   const { addOrUpvoteTag } = require('../tagging/tagsGraphQL');
//   if (!tag) {
//     const name = tagSlug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
//     const tagData = {
//       name: name,
//       slug: tagSlug,
//       userId: botUser._id
//     };   
//
//     const newTag = await createTag({
//       data: tagData
//     }, context);
//     
//     if (!newTag) {
//       //eslint-disable-next-line no-console
//       console.log(`Failed to create tag with slug "${tagSlug}"`); 
//       return;
//     }
//     await addOrUpvoteTag({tagId: newTag._id, postId: postId, currentUser: botUser, context});    
//   }
//   else {
//     await addOrUpvoteTag({tagId: tag._id, postId: postId, currentUser: botUser, context});
//   }
// }

// AFAIU the flow, this has a race condition. If a post is voted on twice in quick succession, it will create two markets.
// This is probably fine, but it's worth noting. We can deal with it if it comes up.
async function maybeCreateReviewMarket({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {
  const { Posts } = context;


  if (collection.collectionName !== "Posts") return;
  if (vote.power <= 0 || vote.cancelled) return; // In principle it would be fine to make a market here, but it should never be first created here
  if ((newDocument.baseScore ?? 0) < reviewMarketCreationMinimumKarmaSetting.get(context)) return;
  const post = await Posts.findOne({_id: newDocument._id})
  if (!post || post.draft) return;
  if (post.postedAt.getFullYear() < (new Date()).getFullYear() - 1) return; // only make markets for posts that haven't had a chance to be reviewed
  if (post.manifoldReviewMarketId) return;

  const annualReviewLink = tagGetAbsoluteUrl({slug: 'lesswrong-review'}, context.forumType)
  const postLink = postGetAbsolutePageUrl(post, context.forumType)

  const year = post.postedAt.getFullYear()
  const initialProb = 14
  const question = `Will "${post.title.length < 50 ? post.title : (post.title.slice(0,45)+"...")}" make the top fifty posts in LessWrong's ${year} Annual Review?`
  const descriptionMarkdown = `As part of LessWrong's [Annual Review](${annualReviewLink}), the community nominates, writes reviews, and votes on the most valuable posts. Posts are reviewable once they have been up for at least 12 months, and the ${year} Review resolves in February ${year+2}.\n\n\nThis market will resolve to 100% if the post [${post.title}](${postLink}) is one of the top fifty posts of the ${year} Review, and 0% otherwise. The market was initialized to ${initialProb}%.`
  const closeTime = new Date(year + 2, 1, 1) // i.e. february 1st of the next next year (so if year is 2022, feb 1 of 2024)
  const visibility = isProduction ? "public" : "unlisted"

  const liteMarket = await createManifoldMarket(question, descriptionMarkdown, closeTime, visibility, initialProb, post._id, context.forumType)

  // Return if market creation fails
  if (!liteMarket) return;
  await Posts.rawUpdateOne(post._id, {$set: {manifoldReviewMarketId: liteMarket.id}})
}
