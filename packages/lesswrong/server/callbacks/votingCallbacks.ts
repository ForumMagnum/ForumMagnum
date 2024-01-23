import moment from 'moment';
import Notifications from '../../lib/collections/notifications/collection';
import { Posts } from '../../lib/collections/posts/collection';
import Users from '../../lib/collections/users/collection';
import { isLWorAF } from '../../lib/instanceSettings';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { userSmallVotePower } from '../../lib/voting/voteTypes';
import { postPublishedCallback } from '../notificationCallbacks';
import { createNotification } from '../notificationCallbacksHelpers';
import { checkForStricterRateLimits } from '../rateLimitUtils';
import { batchUpdateScore } from '../updateScores';
import { triggerCommentAutomodIfNeeded } from "./sunshineCallbackUtils";
import { DatabaseServerSetting } from '../databaseSettings';
import { createMutator } from '../vulcan-lib/mutators';
import { Comments } from '../../lib/collections/comments';
import { createAdminContext } from '../vulcan-lib';
import { addOrUpvoteTag } from '../tagging/tagsGraphQL';
import Tags from '../../lib/collections/tags/collection';

export const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
voteCallbacks.castVoteAsync.add(async function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context) {
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

  if (!!newDocument.userId && isLWorAF && ['Posts', 'Comments'].includes(vote.collectionName)) {
    void checkForStricterRateLimits(newDocument.userId, context);
  }
});

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

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser) {
  // Only update user karma if the operation isn't done by one of the item's authors at the time of the original vote.
  // We expect vote.authorIds here to be the same as the authorIds of the original vote.
  if (vote.authorIds && !vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
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
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
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
});

voteCallbacks.castVoteAsync.add(async function checkAutomod ({newDocument, vote}: VoteDocTuple, collection, user, context) {
  if (vote.collectionName === 'Comments') {
    void triggerCommentAutomodIfNeeded(newDocument, vote);
  }
});


postPublishedCallback.add(async (publishedPost: DbPost) => {
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
});

// When a vote is cast, if it's new karma is above review_market_threshold, create a Manifold
// on it making top 50 in the review, and create a comment linking to the market.

const reviewMarketThreshold = 100;
const manifoldAPIKeySetting = new DatabaseServerSetting<string | null>('manifold.reviewBotKey', null)
const manifoldAPIKey = manifoldAPIKeySetting.get()

const reviewUserBotSetting = new DatabaseServerSetting<string | null>('reviewBotId', null)
const reviewUserBot = reviewUserBotSetting.get()

if (manifoldAPIKey === null) throw new Error("manifoldAPIKey is null")
if (reviewUserBot === null) throw new Error("reviewUserBot is null")

async function addTagToPost(postId: string, tagSlug: string, botUser: DbUser, context: ResolverContext) {
  const tag = await Tags.findOne({slug: tagSlug})
  if (!tag) throw new Error(`Tag with slug "${tagSlug}" not found`)
  await addOrUpvoteTag({tagId: tag._id, postId: postId, currentUser: botUser, context});
}

voteCallbacks.castVoteAsync.add(async ({newDocument, vote}: VoteDocTuple, collection, user, context) => {

  // Forum gate
  if (!isLWorAF) return;

  if (collection.collectionName !== "Posts") return;
  if (vote.power <= 0 || vote.cancelled) return;
  // TODO: does this already include the vote power or must I add it? Think it's included
  if (newDocument.baseScore < reviewMarketThreshold) return;
  const post = await Posts.findOne({_id: newDocument._id})
  if (!post) return;
  if (post.postedAt.getFullYear() < (new Date()).getFullYear() - 1) return; // only make markets for posts that haven't had a chance to be reviewed
  if (post.manifoldReviewMarketId) return; // don't make a market if one already exists

  const botUser = await context.Users.findOne({_id: reviewUserBot})
  const annualReviewLink = 'https://www.lesswrong.com/tag/lesswrong-review'
  const postLink = 'https://www.lesswrong.com/posts/' + post._id + '/' + post.slug

  const year = post.postedAt.getFullYear()
  const initialProb = 14
  const question = `Will "${post.title.length < 50 ? post.title : (post.title.slice(0,45)+"...")}" make the top fifty posts in LessWrong's ${year} Annual Review?`
  const descriptionMarkdown = `As part of LessWrong's [Annual Review](${annualReviewLink}), the community nominates, writes reviews, and votes on the most valuable posts. Posts are reviewable once they have been up for at least 12 months, and the ${year} Review resolves in February ${year+2}.\n\n\nThis market will resolve to 100% if the post [${post.title}](${postLink}) is one of the top fifty posts of the ${year} Review, and 0% otherwise. The market was initialized to ${initialProb}%.` // post.title
  const closeTime = new Date(year + 2, 1, 1) // i.e. february 1st of the next next year (so if year is 2022, feb 1 of 2024)
  const visibility = "unlisted" // set this based on whether we're in dev or prod?
  const groupIds = ["LessWrong Annual Review", `LessWrong ${year} Annual Review`]

  if (!botUser) throw new Error("Bot user not found")

  try {
    const result = await fetch("https://api.manifold.markets/v0/market", {
      method: "POST",
      headers: {
        authorization: `Key ${manifoldAPIKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        outcomeType: "BINARY",
        question: question,
        descriptionMarkdown: descriptionMarkdown,
        closeTime: Number(closeTime),
        visibility: visibility,
        // groupIds: groupIds,
        initialProb: initialProb
      })
    })

    const liteMarket = await result.json()

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    // update the database to include the market id
    await Posts.rawUpdateOne(post._id, {$set: {manifoldReviewMarketId: liteMarket.id}})

    const reviewTagSlug = 'annual-review-market';
    const reviewYearTagSlug = `annual-review-${year}-market`;

    // add the review tags to the post
    await addTagToPost(post._id, reviewTagSlug, botUser, context);
    await addTagToPost(post._id, reviewYearTagSlug, botUser, context);

    // make a comment on the post with the market
    await makeComment(post._id, year, liteMarket.url, botUser)
  } catch (error) {

    //eslint-disable-next-line no-console
    console.error('There was a problem with the fetch operation for creating a Manifold Market: ', error);
  }
})

const makeComment = async (postId: string, year: number, marketUrl: string, botUser: DbUser) => {

  const commentString = `<p>The <a href="https://www.lesswrong.com/bestoflesswrong">LessWrong Review</a> runs every year to select the posts that have most stood the test of time. This post is not yet eligible for review, but will be at the end of ${year+1}. The top fifty or so posts are featured prominently on the site throughout the year. Will this post make the top 50?</p><figure class="media"><div data-oembed-url="${marketUrl}">
        <div class="manifold-preview">
          <iframe src=${marketUrl}>
        </iframe></div>
      </div></figure>
  `

  await createMutator({
    collection: Comments,
    document: {
      postId: postId,
      userId: reviewUserBot,
      contents: {originalContents: {
        type: "html",
        data: commentString
      }}
    },
    currentUser: botUser,
    context: createAdminContext()
  })

}
