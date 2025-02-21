import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';
import Users from '../../lib/collections/users/collection';
import type { VoteDocTuple } from '../../lib/voting/vote';
import Localgroups from '../../lib/collections/localgroups/collection';
import { PostRelations } from '../../lib/collections/postRelations/collection';
import { getDefaultPostLocationFields } from '../posts/utils'
import { cheerioParse } from '../utils/htmlUtil'
import { CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import moment from 'moment';
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import { performCrosspost, handleCrosspostUpdate } from "../fmCrosspost/crosspost";
import { addOrUpvoteTag } from '../tagging/tagsGraphQL';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { MOVED_POST_TO_DRAFT, REJECTED_POST } from '../../lib/collections/moderatorActions/schema';
import { isEAForum } from '../../lib/instanceSettings';
import { captureException } from '@sentry/core';
import { TOS_NOT_ACCEPTED_ERROR } from '../fmCrosspost/resolvers';
import TagRels from '../../lib/collections/tagRels/collection';
import { updatePostDenormalizedTags } from '../tagging/helpers';
import Conversations from '../../lib/collections/conversations/collection';
import Messages from '../../lib/collections/messages/collection';
import { isAnyTest } from '../../lib/executionEnvironment';
import { getAdminTeamAccount, getRejectionMessage } from './commentCallbacks';
import { postStatuses } from '../../lib/collections/posts/constants';
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS, updatePostEmbeddings } from '../embeddings';
import { moveImageToCloudinary } from '../scripts/convertImagesToCloudinary';
import DialogueChecks from '../../lib/collections/dialogueChecks/collection';
import DialogueMatchPreferences from '../../lib/collections/dialogueMatchPreferences/collection';
import { recombeeApi } from '../recombee/client';
import { recombeeEnabledSetting, vertexEnabledSetting } from '../../lib/publicSettings';
import { googleVertexApi } from '../google-vertex/client';
import { postsNewNotifications } from '../notificationCallbacks';
import { getLatestContentsRevision } from '../../lib/collections/revisions/helpers';
import { isRecombeeRecommendablePost } from '@/lib/collections/posts/helpers';
import { createNewJargonTerms } from '../resolvers/jargonResolvers/jargonTermMutations';
import { userCanPassivelyGenerateJargonTerms } from '@/lib/betas';
import { createAdminContext } from "../vulcan-lib/query";
import { createMutator, updateMutator } from "../vulcan-lib/mutators";

const MINIMUM_APPROVAL_KARMA = 5

// Callback for a post being published. This is distinct from being created in
// that it doesn't fire on draft posts, and doesn't fire on posts that are awaiting
// moderator approval because they're a user's first post (but does fire when
// they're approved).
export async function onPostPublished(post: DbPost, context: ResolverContext) {
  updateRecombeeWithPublishedPost(post, context);
  await postsNewNotifications(post);
  const { updateScoreOnPostPublish } = require("./votingCallbacks");
  await updateScoreOnPostPublish(post, context);
  await ensureNonzeroRevisionVersionsAfterUndraft(post, context);
}

if (isEAForum) {
  const checkTosAccepted = <T extends Partial<DbPost>>(currentUser: DbUser | null, post: T): T => {
    if (post.draft === false && !post.shortform && !currentUser?.acceptedTos) {
      throw new Error(TOS_NOT_ACCEPTED_ERROR);
    }
    return post;
  }
  getCollectionHooks("Posts").newSync.add(
    (post: DbPost, currentUser) => checkTosAccepted(currentUser, post),
  );
  getCollectionHooks("Posts").updateBefore.add(
    (post, {currentUser}) => checkTosAccepted(currentUser, post),
  );

  const assertPostTitleHasNoEmojis = (post: DbPost) => {
    if (/\p{Extended_Pictographic}/u.test(post.title)) {
      throw new Error("Post titles cannot contain emojis");
    }
  }
  getCollectionHooks("Posts").newSync.add(assertPostTitleHasNoEmojis);
  getCollectionHooks("Posts").updateBefore.add(assertPostTitleHasNoEmojis);
}

if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
  const updateEmbeddings = async (newPost: DbPost, oldPost?: DbPost) => {
    const hasChanged = !oldPost || oldPost.contents_latest !== newPost.contents_latest;
    if (hasChanged &&
      !newPost.draft &&
      !newPost.deletedDraft &&
      newPost.status === postStatuses.STATUS_APPROVED &&
      !isAnyTest
    ) {
      try {
        await updatePostEmbeddings(newPost._id);
      } catch (e) {
        // We never want to prevent a post from being created/edited just
        // because we fail to create embeddings, but we do want to log it
        captureException(e);
        // eslint-disable-next-line
        console.error("Failed to create embeddings:", e);
      }
    }
  }
  getCollectionHooks("Posts").newAsync.add(
    async (post: DbPost) => await updateEmbeddings(post),
  );
  getCollectionHooks("Posts").updateAsync.add(
    async ({document, oldDocument}) => await updateEmbeddings(
      document,
      oldDocument,
    ),
  );
}

async function checkRecentRepost(post: DbPost): Promise<DbPost> {
  if (!post.draft) {
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
    const existing = await Posts.findOne({
      _id: {$ne: post._id},
      title: post.title,
      userId: post.userId,
      draft: {$ne: true},
      deletedDraft: {$ne: true},
      createdAt: {$gt: oneHourAgo},
    });
    if (existing) {
      throw new Error(`You recently published another post titled "${post.title}"`);
    }
  }
  return post;
}

getCollectionHooks("Posts").newSync.add(checkRecentRepost);
getCollectionHooks("Posts").updateBefore.add(async (data, { newDocument }) => {
  await checkRecentRepost(newDocument);
  return data;
});

getCollectionHooks("Posts").createValidate.add(function DebateMustHaveCoauthor(validationErrors, { document }) {
  if (document.debate && !document.coauthorStatuses?.length) {
    throw new Error('Dialogue must have at least one co-author!');
  }

  return validationErrors;
});

getCollectionHooks("Posts").updateBefore.add(function PostsEditRunPostUndraftedSyncCallbacks (data, { oldDocument: post }) {
  // Set postedAt and wasEverUndrafted when a post is moved out of drafts.
  // If the post has previously been published then moved to drafts, and now
  // it's being republished then we shouldn't reset the `postedAt` date.
  const isRepublish = post.wasEverUndrafted || data.wasEverUndrafted;
  if (data.draft === false && post.draft && !isRepublish) {
    data.postedAt = new Date();
    data.wasEverUndrafted = true;
  }
  return data;
});

export async function increaseMaxBaseScore ({newDocument, vote}: VoteDocTuple) {
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
 if (!postAuthor) throw new Error(`Could not find user: ${post.userId}`);
 const { performVoteServer } = require("../voteServer");
 const {modifiedDocument: votedPost} = await performVoteServer({
   document: post,
   voteType: 'bigUpvote',
   collection: Posts,
   user: postAuthor,
   skipRateLimits: true,
   selfVote: true
 })
 return {...post, ...votedPost} as DbPost;
});

getCollectionHooks("Posts").createAfter.add((post: DbPost, { context }) => {
  if (!post.authorIsUnreviewed && !post.draft) {
    void onPostPublished(post, context);
  }
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

getCollectionHooks("Posts").createAsync.add(async ({document}: CreateCallbackProperties<"Posts">) => {
  if (!document.draft) {
    await triggerReviewIfNeeded(document.userId)
  }
});

getCollectionHooks("Posts").updateAsync.add(async function updatedPostMaybeTriggerReview ({document, oldDocument, context}: UpdateCallbackProperties<"Posts">) {
  if (document.draft || document.rejected) return

  await triggerReviewIfNeeded(oldDocument.userId)
  
  // if the post author is already approved and the post is getting undrafted,
  // or the post author is getting approved,
  // then we consider this "publishing" the post
  if ((oldDocument.draft && !document.authorIsUnreviewed) || (oldDocument.authorIsUnreviewed && !document.authorIsUnreviewed)) {
    await onPostPublished(document, context);
  }
});

async function ensureNonzeroRevisionVersionsAfterUndraft (post: DbPost, context: ResolverContext) {
  // When a post is published, ensure that the version number of its contents
  // revision does not have `draft` set or an 0.x version number (which would
  // affect permissions).
  await context.repos.posts.ensurePostHasNonDraftContents(post._id);
}

interface SendPostRejectionPMParams {
  messageContents: string,
  lwAccount: DbUser,
  post: DbPost,
  noEmail: boolean,
}

async function sendPostRejectionPM({ messageContents, lwAccount, post, noEmail }: SendPostRejectionPMParams) {
  const conversationData: CreateMutatorParams<"Conversations">['document'] = {
    participantIds: [post.userId, lwAccount._id],
    title: `Your post ${post.title} was rejected`,
    moderator: true
  };

  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: lwAccount,
    validate: false
  });

  const messageData = {
    userId: lwAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: messageContents
      }
    },
    conversationId: conversation.data._id,
    noEmail: noEmail
  };

  await createMutator({
    collection: Messages,
    document: messageData,
    currentUser: lwAccount,
    validate: false
  });

  if (!isAnyTest) {
    // eslint-disable-next-line no-console
    console.log("Sent moderation message for post", post._id);
  }
}

getCollectionHooks("Posts").updateAsync.add(async function sendRejectionPM({ newDocument: post, oldDocument: oldPost, currentUser }) {
  const postRejected = post.rejected && !oldPost.rejected;
  if (postRejected) {
    const postUser = await Users.findOne({_id: post.userId});

    const rejectedContentLink = `<span>post, <a href="https://lesswrong.com/posts/${post._id}/${post.slug}">${post.title}</a></span>`
    let messageContents = getRejectionMessage(rejectedContentLink, post.rejectedReason)
  
    // FYI EA Forum: Decide if you want this to always send emails the way you do for deletion. We think it's better not to.
    const noEmail = isEAForum
    ? false 
    : !(!!postUser?.reviewedByUserId && !postUser.snoozedUntilContentCount)
    
    const adminAccount = currentUser ?? await getAdminTeamAccount();
    if (!adminAccount) throw new Error("Couldn't find admin account for sending rejection PM");
  
    await sendPostRejectionPM({
      post,
      messageContents: messageContents,
      lwAccount: adminAccount,
      noEmail,
    });  
  }
});

/**
 * Creates a moderator action when an admin sets one of the user's posts back to draft
 * This also adds a note to a user's sunshineNotes
 */
getCollectionHooks("Posts").updateAsync.add(async function updateUserNotesOnPostDraft ({ document, oldDocument, currentUser, context }: UpdateCallbackProperties<"Posts">) {
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

getCollectionHooks("Posts").updateAsync.add(async function updateUserNotesOnPostRejection ({ document, oldDocument, currentUser, context }: UpdateCallbackProperties<"Posts">) {
  if (!oldDocument.rejected && document.rejected) {
    void createMutator({
      collection: context.ModeratorActions,
      context,
      currentUser,
      document: {
        userId: document.userId,
        type: REJECTED_POST,
        endedAt: new Date()
      }
    });
  }
});

// Use the first image in the post as the social preview image
async function extractSocialPreviewImage (post: DbPost) {
  // socialPreviewImageId is set manually, and will override this
  if (post.socialPreviewImageId) return post

  const contents = await getLatestContentsRevision(post);
  if (!contents) {
    return post;
  }

  let socialPreviewImageAutoUrl = ''
  if (contents?.html) {
    const $ = cheerioParse(contents?.html)
    const firstImg = $('img').first()
    const firstImgSrc = firstImg?.attr('src')
    if (firstImg && firstImgSrc) {
      try {
        socialPreviewImageAutoUrl = await moveImageToCloudinary({oldUrl: firstImgSrc, originDocumentId: post._id}) ?? firstImgSrc
      } catch (e) {
        captureException(e);
        socialPreviewImageAutoUrl = firstImgSrc
      }
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

// For posts without comments, update lastCommentedAt to match postedAt
//
// When the post is created, lastCommentedAt was set to the current date. If an
// admin or site feature updates postedAt that should change the "newness" of
// the post unless there's been active comments.
async function oldPostsLastCommentedAt (post: DbPost) {
  // TODO maybe update this to properly handle AF comments. (I'm guessing it currently doesn't)
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
  !post.hasCoauthorPermission && (post.coauthorStatuses ?? []).filter(({ confirmed }) => !confirmed).length > 0;

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

getCollectionHooks("Posts").updateBefore.add((post: DbPost, {oldDocument: oldPost}: UpdateCallbackProperties<"Posts">) => {
  // Here we schedule the post for 1-day in the future when publishing an existing draft with unconfirmed coauthors
  // We must check post.draft === false instead of !post.draft as post.draft may be undefined in some cases
  if (postHasUnconfirmedCoauthors(post) && post.draft === false && oldPost.draft) {
    post = scheduleCoauthoredPost(post);
  }
  return post;
});

getCollectionHooks("Posts").newSync.add(performCrosspost);
getCollectionHooks("Posts").updateBefore.add(handleCrosspostUpdate);

async function bulkApplyPostTags ({postId, tagsToApply, currentUser, context}: {postId: string, tagsToApply: string[], currentUser: DbUser, context: ResolverContext}) {
  const applyOneTag = async (tagId: string) => {
    try {
      await addOrUpvoteTag({
        tagId, postId,
        currentUser: currentUser!,
        ignoreParent: true,  // Parent tags are already applied by the post submission form, so if the parent tag isn't present the user must have manually removed it
        context
      });
    } catch(e) {
      // This can throw if there's a tag applied which doesn't exist, which
      // can happen if there are issues with the search index.
      //
      // If we fail to add a tag, capture the exception in Sentry but don't
      // throw from the form-submission callback. From the user perspective
      // letting this exception esscape would make posting appear to fail (but
      // actually the post is created, minus some of its callbacks having
      // completed).
      captureException(e)
    }
  }
  await Promise.all(tagsToApply.map(applyOneTag))
}

async function bulkRemovePostTags ({tagRels, currentUser, context}: {tagRels: DbTagRel[], currentUser: DbUser, context: ResolverContext}) {
  const clearOneTag = async (tagRel: DbTagRel) => {
    try {
      const { clearVotesServer } = require("../voteServer");
      await clearVotesServer({ document: tagRel, collection: TagRels, user: currentUser, context})
    } catch(e) {
      captureException(e)
    }
  }
  await Promise.all(tagRels.map(clearOneTag))
}

getCollectionHooks("Posts").createAfter.add(async (post: DbPost, props: CreateCallbackProperties<"Posts">) => {
  const {currentUser, context} = props;
  if (!currentUser) return post; // Shouldn't happen, but just in case
  
  if (post.tagRelevance) {
    // Convert tag relevances in a new-post submission to creating new TagRel objects, and upvoting them.
    const tagsToApply = Object.keys(post.tagRelevance);
    post = {...post, tagRelevance: undefined};
    await bulkApplyPostTags({postId: post._id, tagsToApply, currentUser, context})
  }

  return post;
});

getCollectionHooks("Posts").updateAfter.add(async (post: DbPost, props: CreateCallbackProperties<"Posts">) => {
  const {currentUser, context} = props;
  if (!currentUser) return post; // Shouldn't happen, but just in case

  if (post.tagRelevance) {
    const existingTagRels = await TagRels.find({ postId: post._id, baseScore: {$gt: 0}, deleted: false }).fetch()
    const existingTagIds = existingTagRels.map(tr => tr.tagId);

    const formTagIds = Object.keys(post.tagRelevance);
    const tagsToApply = formTagIds.filter(tagId => !existingTagIds.includes(tagId));
    const tagsToRemove = existingTagIds.filter(tagId => !formTagIds.includes(tagId));

    const applyPromise = bulkApplyPostTags({postId: post._id, tagsToApply, currentUser, context})
    const removePromise = bulkRemovePostTags({tagRels: existingTagRels.filter(tagRel => tagsToRemove.includes(tagRel.tagId)), currentUser, context})

    await Promise.all([applyPromise, removePromise])
    if (tagsToApply.length || tagsToRemove.length) {
      // Rebuild the tagRelevance field on the post. It's unfortunate that we have to do this extra (slow) step, but
      // it's necessary because tagRelevance can depend on votes from other people so it's not that straightforward to
      // work out the final state from the data we have here.
      // This isn't necessary in the create case because we know there will be no existing tagRels when a post is created
      await updatePostDenormalizedTags(post._id);
    }
  }

  return post;
});

getCollectionHooks("Posts").updateAfter.add(async (post: DbPost, props: UpdateCallbackProperties<"Posts">) => {
  const { oldDocument: oldPost } = props;
  const adminContext = createAdminContext();

  async function resetDialogueMatch(matchForm: DbDialogueMatchPreference) {
    const dialogueCheck = await DialogueChecks.findOne(matchForm.dialogueCheckId);
    if (dialogueCheck) {
      await Promise.all([
        updateMutator({ // reset check
          collection: DialogueChecks,
          documentId: dialogueCheck._id,
          set: { checked: false, hideInRecommendations: false },
          currentUser: adminContext.currentUser,
          context: adminContext,
          validate: false
        }),
        updateMutator({ // soft delete topic form
          collection: DialogueMatchPreferences,
          documentId: matchForm._id,
          set: { deleted: true },
          currentUser: adminContext.currentUser,
          context: adminContext,
          validate: false
        })
      ]);
    }
  }

  if (post.collabEditorDialogue && post.draft === false && oldPost.draft) {
    const matchForms = await DialogueMatchPreferences.find({generatedDialogueId: post._id, deleted: {$ne: true}}).fetch()
      await Promise.all(matchForms.map(resetDialogueMatch))
  }
  return post;
});

/* Recombee callbacks */

function updateRecombeeWithPublishedPost(post: DbPost, context: ResolverContext) {
  if (!isRecombeeRecommendablePost(post)) return;

  if (recombeeEnabledSetting.get()) {
    void recombeeApi.upsertPost(post, context)
      // eslint-disable-next-line no-console
      .catch(e => console.log('Error when sending published post to recombee', { e }));
  }

  if (vertexEnabledSetting.get()) {
    void googleVertexApi.upsertPost({ post }, context)
      // eslint-disable-next-line no-console
      .catch(e => console.log('Error when sending published post to google vertex', { e }));
  }
}

getCollectionHooks("Posts").updateAsync.add(async ({ newDocument, oldDocument, context }) => {
  // newDocument is only a "preview" and does not reliably have full post data, e.g. is missing contents.html
  // This does seem likely to be a bug in a the mutator logic
  const post = await context.loaders.Posts.load(newDocument._id);
  const redrafted = post.draft && !oldDocument.draft
  if ((post.draft && !redrafted) || !isRecombeeRecommendablePost(post)) return;

  if (recombeeEnabledSetting.get()) {
    void recombeeApi.upsertPost(post, context)
    // eslint-disable-next-line no-console
    .catch(e => console.log('Error when sending updated post to recombee', { e }));
  }

  if (vertexEnabledSetting.get()) {
    void googleVertexApi.upsertPost({ post }, context)
      // eslint-disable-next-line no-console
      .catch(e => console.log('Error when sending updated post to google vertex', { e }));
  }
});

export function updateRecombeeVote({ newDocument, vote }: VoteDocTuple, collection: CollectionBase<VoteableCollectionName>, user: DbUser, context: ResolverContext) {
  if (vote.collectionName !== 'Posts' || newDocument.userId === vote.userId || !isRecombeeRecommendablePost(newDocument as DbPost)) return;

  if (recombeeEnabledSetting.get()) {
    void recombeeApi.upsertPost(newDocument as DbPost, context)
    // eslint-disable-next-line no-console
    .catch(e => console.log('Error when sending voted-on post to recombee', { e }));
  }
  
  // Vertex doesn't track any sort of "rating" or "score" (i.e. karma) for documents, so no point in pushing updates to it when posts are voted on
}

getCollectionHooks("Posts").editSync.add(async function removeFrontpageDate(
  modifier: MongoModifier<DbPost>,
  _post: DbPost,
): Promise<MongoModifier<DbPost>> {
  if (
    modifier.$set?.submitToFrontpage === false ||
    modifier.$set?.submitToFrontpage === null ||
    modifier.$unset?.submitToFrontpage
  ) {
    modifier.$unset ??= {};
    modifier.$unset.frontpageDate = 1;
  }
  return modifier;
});

async function createNewJargonTermsCallback(post: DbPost, callbackProperties: CreateCallbackProperties<"Posts">) {
  const { context: { currentUser, loaders, JargonTerms } } = callbackProperties;
  const oldPost = 'oldDocument' in callbackProperties ? callbackProperties.oldDocument as DbPost : null;

  if (!currentUser) return post;
  if (currentUser._id !== post.userId) return post;
  if (!post.contents_latest) return post;
  if (post.draft && !post.generateDraftJargon) return post;
  if (!post.draft && !currentUser.generateJargonForPublishedPosts) return post;
  if (oldPost?.contents_latest === post.contents_latest) return post;

  if (!userCanPassivelyGenerateJargonTerms(currentUser)) return post;
  // TODO: refactor this so that createNewJargonTerms handles the case where we might be creating duplicate terms
  const [existingJargon, newContents] = await Promise.all([
    JargonTerms.find({postId: post._id}).fetch(),
    loaders.Revisions.load(post.contents_latest)
  ]);

  if (!newContents?.html) {
    return post;
  }
  
  const { changeMetrics } = newContents;

  // TODO: do we want different behavior for new vs updated posts?
  if (changeMetrics.added > 1000 || !existingJargon.length) {
    // TODO: do we want to exclude existing jargon terms from being added again for posts which had a large diff but already had some jargon terms?
    void createNewJargonTerms({ postId: post._id, currentUser });
  }

  return post;
}

getCollectionHooks("Posts").createAfter.add(createNewJargonTermsCallback);

getCollectionHooks("Posts").updateAfter.add(createNewJargonTermsCallback);
