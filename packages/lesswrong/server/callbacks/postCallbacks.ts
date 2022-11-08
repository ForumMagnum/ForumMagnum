import { createMutator } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';
import Users from '../../lib/collections/users/collection';
import { performVoteServer } from '../voteServer';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import Localgroups from '../../lib/collections/localgroups/collection';
import { PostRelations } from '../../lib/collections/postRelations/index';
import { getDefaultPostLocationFields } from '../posts/utils'
import cheerio from 'cheerio'
import { CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { postPublishedCallback } from '../notificationCallbacks';
import moment from 'moment';
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import { performCrosspost, handleCrosspostUpdate } from "../fmCrosspost";
import { addOrUpvoteTag } from '../tagging/tagsGraphQL';
import { userIsAdmin } from '../../lib/vulcan-users';
import { MOVED_POST_TO_DRAFT } from '../../lib/collections/moderatorActions/schema';
import { convertImagesInPost } from '../scripts/convertImagesToCloudinary';

const MINIMUM_APPROVAL_KARMA = 5

getCollectionHooks("Posts").updateBefore.add(function PostsEditRunPostUndraftedSyncCallbacks (data, { oldDocument: post }) {
  if (data.draft === false && post.draft) {
    data = postsSetPostedAt(data);
  }
  return data;
});

// set postedAt when a post is moved out of drafts
function postsSetPostedAt (data: Partial<DbPost>) {
  data.postedAt = new Date();
  return data;
}

voteCallbacks.castVoteAsync.add(async function increaseMaxBaseScore ({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
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
});

getCollectionHooks("Posts").newSync.add(async function PostsNewDefaultLocation(post: DbPost): Promise<DbPost> {
  return {...post, ...(await getDefaultPostLocationFields(post))}
});

getCollectionHooks("Posts").newSync.add(async function PostsNewDefaultTypes(post: DbPost): Promise<DbPost> {
  if (post.isEvent && post.groupId && !post.types) {
    const localgroup = await Localgroups.findOne(post.groupId) 
    if (!localgroup) throw Error(`Wasn't able to find localgroup for post ${post}`)
    const { types } = localgroup
    post = {...post, types}
  }
  return post
});

// LESSWRONG – bigUpvote
getCollectionHooks("Posts").newAfter.add(async function LWPostsNewUpvoteOwnPost(post: DbPost): Promise<DbPost> {
 var postAuthor = await Users.findOne(post.userId);
 const votedPost = postAuthor && await performVoteServer({ document: post, voteType: 'bigUpvote', collection: Posts, user: postAuthor })
 return {...post, ...votedPost} as DbPost;
});

getCollectionHooks("Posts").createAfter.add((post: DbPost) => {
  if (!post.authorIsUnreviewed && !post.draft) {
    void postPublishedCallback.runCallbacksAsync([post]);
  }
});

/**
 * For posts created in a subforum, add the appropriate tag
 */
getCollectionHooks("Posts").createAfter.add(async function subforumAddTag(post: DbPost, properties: CreateCallbackProperties<DbPost>) {
  const { context } = properties

  if (post.subforumTagId && context.currentUser?._id) {
    const currentUser = context.currentUser
    await addOrUpvoteTag({tagId: post.subforumTagId, postId: post._id, currentUser, context})
  }
  return post
});

getCollectionHooks("Posts").newSync.add(async function PostsNewUserApprovedStatus (post) {
  const postAuthor = await Users.findOne(post.userId);
  if (!postAuthor?.reviewedByUserId && (postAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...post, authorIsUnreviewed: true}
  }
  return post;
});

getCollectionHooks("Posts").createBefore.add(function AddReferrerToPost(post, properties)
{
  if (properties && properties.context && properties.context.headers) {
    let referrer = properties.context.headers["referer"];
    let userAgent = properties.context.headers["user-agent"];
    
    return {
      ...post,
      referrer: referrer,
      userAgent: userAgent,
    };
  }
});

getCollectionHooks("Posts").newAfter.add(function PostsNewPostRelation (post) {
  if (post.originalPostRelationSourceId) {
    void createMutator({
      collection: PostRelations,
      document: {
        type: "subQuestion",
        sourcePostId: post.originalPostRelationSourceId,
        targetPostId: post._id,
      },
      validate: false,
    })
  }
  return post
});

getCollectionHooks("Posts").editAsync.add(async function UpdatePostShortform (newPost, oldPost) {
  if (!!newPost.shortform !== !!oldPost.shortform) {
    const shortform = !!newPost.shortform;
    await Comments.rawUpdateMany(
      { postId: newPost._id },
      { $set: {
        shortform: shortform
      } },
      { multi: true }
    );
  }
});

// If an admin changes the "hideCommentKarma" setting of a post after it
// already has comments, update those comments' hideKarma field to have the new
// setting. This should almost never be used, as we really don't want to
// surprise users by revealing their supposedly hidden karma.
getCollectionHooks("Posts").editAsync.add(async function UpdateCommentHideKarma (newPost, oldPost) {
  if (newPost.hideCommentKarma === oldPost.hideCommentKarma) return

  const comments = Comments.find({postId: newPost._id})
  if (!(await comments.count())) return
  const updates = (await comments.fetch()).map(comment => ({
    updateOne: {
      filter: {
        _id: comment._id,
      },
      update: {$set: {hideKarma: newPost.hideCommentKarma}}
    }
  }))
  await Comments.rawCollection().bulkWrite(updates)
});

getCollectionHooks("Posts").createAsync.add(async ({document}: CreateCallbackProperties<DbPost>) => {
  if (!document.draft) {
    await triggerReviewIfNeeded(document.userId)
  }
});

getCollectionHooks("Posts").updateAsync.add(async function updatedPostMaybeTriggerReview ({document, oldDocument}: UpdateCallbackProperties<DbPost>) {
  if (document.draft) return

  await triggerReviewIfNeeded(oldDocument.userId)
  
  // if the post author is already approved and the post is getting undrafted,
  // or the post author is getting approved,
  // then we consider this "publishing" the post
  if ((oldDocument.draft && !document.authorIsUnreviewed) || (oldDocument.authorIsUnreviewed && !document.authorIsUnreviewed)) {
    await postPublishedCallback.runCallbacksAsync([document]);
  }
});

/**
 * Creates a moderator action when an admin sets one of the user's posts back to draft
 * This also adds a note to a user's sunshineNotes
 */
getCollectionHooks("Posts").updateAsync.add(async function updateUserNotesOnPostDraft ({ document, oldDocument, currentUser, context }: UpdateCallbackProperties<DbPost>) {
  if (!oldDocument.draft && document.draft && userIsAdmin(currentUser)) {
    void createMutator({
      collection: context.ModeratorActions,
      context,
      currentUser,
      document: {
        userId: document.userId,
        type: MOVED_POST_TO_DRAFT,
        endedAt: new Date()
      }
    });
  }
});

// Use the first image in the post as the social preview image
async function extractSocialPreviewImage (post: DbPost) {
  // socialPreviewImageId is set manually, and will override this
  if (post.socialPreviewImageId) return post

  let socialPreviewImageAutoUrl = ''
  if (post.contents?.html) {
    const $ = cheerio.load(post.contents.html)
    const firstImg = $('img').first()
    if (firstImg) {
      socialPreviewImageAutoUrl = firstImg.attr('src') || ''
    }
  }
  
  // Side effect is necessary, as edit.async does not run a db update with the
  // returned value
  // It's important to run this regardless of whether or not we found an image,
  // as removing an image should remove the social preview for that image
  await Posts.rawUpdateOne({ _id: post._id }, {$set: { socialPreviewImageAutoUrl }})
  
  return {...post, socialPreviewImageAutoUrl}
  
}

getCollectionHooks("Posts").editAsync.add(async function updatedExtractSocialPreviewImage(post: DbPost) {await extractSocialPreviewImage(post)})
getCollectionHooks("Posts").newAfter.add(extractSocialPreviewImage)

/**
 * Reupload images to cloudinary. This is mainly for images pasted from google docs, because
 * they have fairly strict rate limits that often result in them failing to load.
 *
 * NOTE: This will soon become obsolete because we are going to make it so images
 * are automatically reuploaded on paste rather than on submit (see https://app.asana.com/0/628521446211730/1203311932993130/f).
 * It's fine to leave it here just in case though
 */
getCollectionHooks("Posts").editAsync.add(async (post: DbPost) => {await convertImagesInPost(post._id)})
getCollectionHooks("Posts").newAsync.add(async (post: DbPost) => {await convertImagesInPost(post._id)})

// For posts without comments, update lastCommentedAt to match postedAt
//
// When the post is created, lastCommentedAt was set to the current date. If an
// admin or site feature updates postedAt that should change the "newness" of
// the post unless there's been active comments.
async function oldPostsLastCommentedAt (post: DbPost) {
  if (post.commentCount) return

  await Posts.rawUpdateOne({ _id: post._id }, {$set: { lastCommentedAt: post.postedAt }})
}

getCollectionHooks("Posts").editAsync.add(oldPostsLastCommentedAt)

getCollectionHooks("Posts").newSync.add(async function FixEventStartAndEndTimes(post: DbPost): Promise<DbPost> {
  // make sure courses/programs have no end time
  // (we don't want them listed for the length of the course, just until the application deadline / start time)
  if (post.eventType === 'course') {
    return {
      ...post,
      endTime: null
    }
  }

  // If the post has an end time but no start time, move the time given to the startTime
  // slot, and leave the end time blank
  if (post?.endTime && !post?.startTime) {
    return {
      ...post,
      startTime: post.endTime,
      endTime: null,
    };
  }
  
  // If both start time and end time are given but they're swapped, swap them to
  // the right order
  if (post.startTime && post.endTime && moment(post.startTime).isAfter(post.endTime)) {
    return {
      ...post,
      startTime: post.endTime,
      endTime: post.startTime,
    };
  }
  
  return post;
});

getCollectionHooks("Posts").editSync.add(async function clearCourseEndTime(modifier: MongoModifier<DbPost>, post: DbPost): Promise<MongoModifier<DbPost>> {
  // make sure courses/programs have no end time
  // (we don't want them listed for the length of the course, just until the application deadline / start time)
  if (post.eventType === 'course') {
    modifier.$set.endTime = null;
  }
  
  return modifier
})

const postHasUnconfirmedCoauthors = (post: DbPost): boolean =>
  !post.hasCoauthorPermission && post.coauthorStatuses?.filter(({ confirmed }) => !confirmed).length > 0;

const scheduleCoauthoredPost = (post: DbPost): DbPost => {
  const now = new Date();
  post.postedAt = new Date(now.setDate(now.getDate() + 1));
  post.isFuture = true;
  return post;
}

getCollectionHooks("Posts").newSync.add((post: DbPost): DbPost => {
  if (postHasUnconfirmedCoauthors(post) && !post.draft) {
    post = scheduleCoauthoredPost(post);
  }
  return post;
});

getCollectionHooks("Posts").updateBefore.add((post: DbPost, {oldDocument: oldPost}: UpdateCallbackProperties<DbPost>) => {
  // Here we schedule the post for 1-day in the future when publishing an existing draft with unconfirmed coauthors
  // We must check post.draft === false instead of !post.draft as post.draft may be undefined in some cases
  if (postHasUnconfirmedCoauthors(post) && post.draft === false && oldPost.draft) {
    post = scheduleCoauthoredPost(post);
  }
  return post;
});

getCollectionHooks("Posts").newSync.add((post: DbPost) => performCrosspost(post));
getCollectionHooks("Posts").updateBefore.add((
  data: Partial<DbPost>,
  {document}: UpdateCallbackProperties<DbPost>,
) => handleCrosspostUpdate(document, data));

getCollectionHooks("Posts").createAfter.add(async (post: DbPost, props: CreateCallbackProperties<DbPost>) => {
  const {currentUser, context} = props;
  
  if (post.tagRelevance) {
    // Convert tag relevances in a new-post submission to creating new TagRel objects, and upvoting them.
    const tagsToApply = Object.keys(post.tagRelevance);
    post = {...post, tagRelevance: undefined};
    
    for (let tagId of tagsToApply) {
      await addOrUpvoteTag({
        tagId, postId: post._id,
        currentUser: currentUser!,
        context
      });
    }
  }
  
  return post;
});

