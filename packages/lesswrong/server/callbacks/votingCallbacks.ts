import moment from 'moment';
import Notifications from '../../server/collections/notifications/collection';
import { Posts } from '../../server/collections/posts/collection';
import Users from '../../server/collections/users/collection';
import { isLWorAF, reviewMarketCreationMinimumKarmaSetting } from '../../lib/instanceSettings';
import type { VoteDocTuple } from '../../lib/voting/vote';
import { userSmallVotePower } from '../../lib/voting/voteTypes';
import { createNotification } from '../notificationCallbacksHelpers';
import { checkForStricterRateLimits } from '../rateLimitUtils';
import { batchUpdateScore } from '../updateScores';
import { triggerCommentAutomodIfNeeded } from "./sunshineCallbackUtils";
import { createMutator } from '../vulcan-lib/mutators';
import { createAdminContext } from '../vulcan-lib/createContexts';
import Tags from '../../server/collections/tags/collection';
import { isProduction } from '../../lib/executionEnvironment';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { createManifoldMarket } from '../../lib/collections/posts/annualReviewMarkets';
import { RECEIVED_SENIOR_DOWNVOTES_ALERT } from '../../lib/collections/moderatorActions/newSchema';
import { revokeUserAFKarmaForCancelledVote, grantUserAFKarmaForVote } from './alignment-forum/callbacks';
import { updateModerateOwnPersonal, updateTrustedStatus } from '../users/moderationUtils';
import { captureException } from '@sentry/core';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { updatePostDenormalizedTags } from '../tagging/helpers';
import { updateDenormalizedContributorsList } from '../utils/contributorsUtil';
import { MultiDocuments } from '@/server/collections/multiDocuments/collection';

async function increaseMaxBaseScore({newDocument, vote}: VoteDocTuple) {
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
  void updatePostDenormalizedTags(postId);
}

export async function recomputeContributorScoresFor(votedRevision: DbRevision, context: ResolverContext) {
  if (votedRevision.collectionName !== "Tags" && votedRevision.collectionName !== "MultiDocuments") return;

  if (votedRevision.collectionName === "Tags") {
    const tag = await Tags.findOne({_id: votedRevision.documentId});
    if (!tag) return;
    await updateDenormalizedContributorsList({ document: tag, collectionName: 'Tags', fieldName: 'description', context });
  } else if (votedRevision.collectionName === "MultiDocuments") {
    const multiDocument = await MultiDocuments.findOne({_id: votedRevision.documentId});
    if (!multiDocument) return;
    await updateDenormalizedContributorsList({ document: multiDocument, collectionName: 'MultiDocuments', fieldName: 'contents', context });
  }
}

export async function onVoteCancel(newDocument: DbVoteableType, vote: DbVote, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext): Promise<void> {
  voteUpdatePostDenormalizedTags({newDocument});
  cancelVoteKarma({newDocument, vote}, collection, user);
  void cancelVoteCount({newDocument, vote});
  void revokeUserAFKarmaForCancelledVote({newDocument, vote});
  
  
  if (vote.collectionName === "Revisions") {
    const rev = (newDocument as DbRevision);
    if (rev.collectionName === "Tags" || rev.collectionName === "MultiDocuments") {
      await recomputeContributorScoresFor(newDocument as DbRevision, context);
    }
  }
}
export async function onCastVoteAsync(voteDocTuple: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext): Promise<void> {
  void grantUserAFKarmaForVote(voteDocTuple);
  void updateTrustedStatus(voteDocTuple, context);
  void updateModerateOwnPersonal(voteDocTuple, context);
  void increaseMaxBaseScore(voteDocTuple);
  void voteUpdatePostDenormalizedTags(voteDocTuple);

  const { vote, newDocument } = voteDocTuple;
  if (vote.collectionName === "Revisions") {
    const rev = (newDocument as DbRevision);
    if (rev.collectionName === "Tags" || rev.collectionName === "MultiDocuments") {
      await recomputeContributorScoresFor(newDocument as DbRevision, context);
    }
  }

  void updateKarma(voteDocTuple, collection, user, context);
  void incVoteCount(voteDocTuple);
  void checkAutomod(voteDocTuple, collection, user, context);
  await maybeCreateReviewMarket(voteDocTuple, collection, user, context);
  await maybeCreateModeratorAlertsAfterVote(voteDocTuple, collection, user, context);
}

export const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]

function votesCanTriggerReview(content: DbPost | DbComment) {
  const sixMonthsAgo = moment().subtract(6, 'months');
  return moment(content.postedAt).isAfter(sixMonthsAgo);
}

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
async function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {
  // Only update user karma if the operation isn't done by one of the item's current authors.
  // We don't want to let any of the authors give themselves or another author karma for this item.
  // We need to await it so that the subsequent check for whether any stricter rate limits apply can do a proper comparison between old and new karma
  if (vote.authorIds && !vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
  // if (!vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    const users = await Users.find({_id: {$in: vote.authorIds}}).fetch();
    await Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: vote.power}});
    
    if (newDocument.userId) {
      for (let user of users) {
        const oldKarma = user.karma;
        const newKarma = oldKarma + vote.power;
        void userKarmaChangedFrom(newDocument.userId, oldKarma, newKarma, context);
      }  
    }
  }

  
  if (!!newDocument.userId && isLWorAF && ['Posts', 'Comments'].includes(vote.collectionName) && votesCanTriggerReview(newDocument as DbPost | DbComment)) {
    void checkForStricterRateLimits(newDocument.userId, context);
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

function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser) {
  // Only update user karma if the operation isn't done by one of the item's authors at the time of the original vote.
  // We expect vote.authorIds here to be the same as the authorIds of the original vote.
  if (vote.authorIds && !vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: -vote.power}});
  }
}


async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  // Increment the count for the person casting the vote
  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: 1, voteCount: 1}});
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: 1, voteReceivedCount: 1}});
  }
}

async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: -1, voteCount: -1}});
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: -1, voteReceivedCount: -1}});
  }
}

async function checkAutomod ({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {
  if (vote.collectionName === 'Comments') {
    void triggerCommentAutomodIfNeeded(newDocument, vote);
  }
}


export async function updateScoreOnPostPublish(publishedPost: DbPost, context: ResolverContext) {
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

async function addTagToPost(postId: string, tagSlug: string, botUser: DbUser, context: ResolverContext) {
  const tag = await Tags.findOne({slug: tagSlug})
  const { addOrUpvoteTag } = require('../tagging/tagsGraphQL');
  if (!tag) {
    const name = tagSlug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    const tagData = {
      name: name,
      slug: tagSlug,
      userId: botUser._id
    };   

    const {data: newTag} = await createMutator({
      collection: Tags,
      document: tagData,
      validate: false,
      currentUser: botUser,
    });
    if (!newTag) {
      //eslint-disable-next-line no-console
      console.log(`Failed to create tag with slug "${tagSlug}"`); 
      return;
    }
    await addOrUpvoteTag({tagId: newTag._id, postId: postId, currentUser: botUser, context});    
  }
  else {
    await addOrUpvoteTag({tagId: tag._id, postId: postId, currentUser: botUser, context});
  }
}

// AFAIU the flow, this has a race condition. If a post is voted on twice in quick succession, it will create two markets.
// This is probably fine, but it's worth noting. We can deal with it if it comes up.
async function maybeCreateReviewMarket({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {

  // Forum gate
  if (!isLWorAF) return;

  if (collection.collectionName !== "Posts") return;
  if (vote.power <= 0 || vote.cancelled) return; // In principle it would be fine to make a market here, but it should never be first created here
  if (newDocument.baseScore < reviewMarketCreationMinimumKarmaSetting.get()) return;
  const post = await Posts.findOne({_id: newDocument._id})
  if (!post || post.draft || post.deletedDraft) return;
  if (post.postedAt.getFullYear() < (new Date()).getFullYear() - 1) return; // only make markets for posts that haven't had a chance to be reviewed
  if (post.manifoldReviewMarketId) return;

  const annualReviewLink = tagGetUrl({slug: 'lesswrong-review'}, {}, true)
  const postLink = postGetPageUrl(post, true)

  const year = post.postedAt.getFullYear()
  const initialProb = 14
  const question = `Will "${post.title.length < 50 ? post.title : (post.title.slice(0,45)+"...")}" make the top fifty posts in LessWrong's ${year} Annual Review?`
  const descriptionMarkdown = `As part of LessWrong's [Annual Review](${annualReviewLink}), the community nominates, writes reviews, and votes on the most valuable posts. Posts are reviewable once they have been up for at least 12 months, and the ${year} Review resolves in February ${year+2}.\n\n\nThis market will resolve to 100% if the post [${post.title}](${postLink}) is one of the top fifty posts of the ${year} Review, and 0% otherwise. The market was initialized to ${initialProb}%.`
  const closeTime = new Date(year + 2, 1, 1) // i.e. february 1st of the next next year (so if year is 2022, feb 1 of 2024)
  const visibility = isProduction ? "public" : "unlisted"

  const liteMarket = await createManifoldMarket(question, descriptionMarkdown, closeTime, visibility, initialProb, post._id)

  // Return if market creation fails
  if (!liteMarket) return;
  await Posts.rawUpdateOne(post._id, {$set: {manifoldReviewMarketId: liteMarket.id}})
}

async function maybeCreateModeratorAlertsAfterVote({ newDocument, vote }: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {
  if (!isLWorAF || vote.collectionName !== 'Comments' || !newDocument.userId) {
    return;
  }

  const adminContext = createAdminContext();

  const { userId } = newDocument;

  try {
    const [longtermDownvoteScore, previousAlert] = await Promise.all([
      context.repos.votes.getLongtermDownvoteScore(userId),
      context.ModeratorActions.findOne({ userId, type: RECEIVED_SENIOR_DOWNVOTES_ALERT }, { sort: { createdAt: -1 } })
    ]);
  
    // This seems to happen for new users or users who haven't been voted on at all by longterm senior users
    if (!longtermDownvoteScore) {
      return;
    }
  
    // If the user has already been flagged with this moderator action in the last month, no need to apply it again
    if (previousAlert && moment(previousAlert.createdAt).isAfter(moment().subtract(1, 'month'))) {
      return;
    }
  
    const {
      commentCount,
      longtermScore,
      longtermSeniorDownvoterCount
    } = longtermDownvoteScore;
  
    if (commentCount > 20 && longtermSeniorDownvoterCount >= 3 && longtermScore < 0) {
      void createMutator({
        collection: context.ModeratorActions,
        document: {
          type: RECEIVED_SENIOR_DOWNVOTES_ALERT,
          userId: userId,
          endedAt: new Date()
        },
        context: adminContext,
        currentUser: adminContext.currentUser,
      });
    }
  } catch (err) {
    captureException(err);
  }
}
