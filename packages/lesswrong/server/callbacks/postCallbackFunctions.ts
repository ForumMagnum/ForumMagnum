import moment from "moment";
import { rateLimitDateWhenUserNextAbleToPost } from "../rateLimitUtils";
import type { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, UpdateCallbackProperties } from "../mutationCallbacks";
import { getDefaultPostLocationFields } from "../posts/utils";
import { generateLinkSharingKey } from "../ckEditor/ckEditorCallbacks";
import { addOrUpvoteTag } from "../tagging/tagsGraphQL";
import { captureException } from "@sentry/core";
import { userCanPassivelyGenerateJargonTerms } from "@/lib/betas";
import { createNewJargonTerms } from "../resolvers/jargonResolvers/jargonTermMutations";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createMutator, updateMutator } from "../vulcan-lib/mutators";
import { moveImageToCloudinary } from "../scripts/convertImagesToCloudinary";
import { getLatestContentsRevision } from "@/lib/collections/revisions/helpers";
import { cheerioParse } from "../utils/htmlUtil";
import { getConfirmedCoauthorIds, postIsApproved } from "@/lib/collections/posts/helpers";
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import { Posts } from "@/lib/collections/posts";
import { isAnyTest, isE2E } from "@/lib/executionEnvironment";
import { requireReviewToFrontpagePostsSetting, eaFrontpageDateDefault } from "@/lib/instanceSettings";
import { isWeekend } from "@/lib/utils/timeUtil";
import { fetchFragmentSingle } from "../fetchFragment";
import { getAutoAppliedTags, checkTags, checkFrontpage, getTagBotAccount } from "../languageModels/autoTagCallbacks";
import { getOpenAI } from "../languageModels/languageModelIntegration";
import { autoFrontpageSetting, tagBotActiveTimeSetting } from "../databaseSettings";

// Check whether the given user can post a post right now. If they can, does
// nothing; if they would exceed a rate limit, throws an exception.
async function enforcePostRateLimit (user: DbUser) {
  const rateLimit = await rateLimitDateWhenUserNextAbleToPost(user);
  if (rateLimit) {
    const {nextEligible} = rateLimit;
    if (nextEligible > new Date()) {
      // "fromNow" makes for a more human readable "how long till I can comment/post?".
      // moment.relativeTimeThreshold ensures that it doesn't appreviate unhelpfully to "now"
      moment.relativeTimeThreshold('ss', 0);
      throw new Error(`Rate limit: You cannot post for ${moment(nextEligible).fromNow()}, until ${nextEligible}`);
    }
  }
}

/* CREATE VALIDATE */
export function debateMustHaveCoauthor(validationErrors: CallbackValidationErrors, { document }: CreateCallbackProperties<'Posts'>): CallbackValidationErrors {
  if (document.debate && !document.coauthorStatuses?.length) {
    throw new Error('Dialogue must have at least one co-author!');
  }

  return validationErrors;
}

export async function postsNewRateLimit (validationErrors: CallbackValidationErrors, { newDocument: post, currentUser }: CreateCallbackProperties<'Posts'>): Promise<CallbackValidationErrors> {
  if (!post.draft && !post.isEvent) {
    await enforcePostRateLimit(currentUser!);
  }
  return validationErrors;
}

/* CREATE BEFORE */
export function addReferrerToPost(post: DbInsertion<DbPost>, properties: CreateCallbackProperties<'Posts'>): DbInsertion<DbPost> | undefined {
  if (properties && properties.context && properties.context.headers) {
    let referrer = properties.context.headers["referer"];
    let userAgent = properties.context.headers["user-agent"];
    
    return {
      ...post,
      referrer: referrer,
      userAgent: userAgent,
    };
  }
}


/* NEW SYNC */
export async function checkRecentRepost(post: DbPost, user: DbUser | null, context: ResolverContext): Promise<DbPost> {
  const { Posts } = context;

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

export async function postsNewDefaultLocation(post: DbPost): Promise<DbPost> {
  return {
    ...post,
    ...(await getDefaultPostLocationFields(post))
  };
}

export async function postsNewDefaultTypes(post: DbPost, user: DbUser | null, context: ResolverContext): Promise<DbPost> {
  const { Localgroups } = context;

  if (post.isEvent && post.groupId && !post.types) {
    const localgroup = await Localgroups.findOne(post.groupId) 
    if (!localgroup) throw Error(`Wasn't able to find localgroup for post ${post}`)
    const { types } = localgroup
    post = {...post, types}
  }

  return post;
}

const MINIMUM_APPROVAL_KARMA = 5;

export async function postsNewUserApprovedStatus (post: DbPost, user: DbUser | null, context: ResolverContext): Promise<DbPost> {
  const { Users } = context;
  const postAuthor = await Users.findOne(post.userId);
  if (!postAuthor?.reviewedByUserId && (postAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...post, authorIsUnreviewed: true}
  }
  return post;
}

export async function fixEventStartAndEndTimes(post: DbPost): Promise<DbPost> {
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
}


function postHasUnconfirmedCoauthors(post: DbPost): boolean {
  return !post.hasCoauthorPermission && (post.coauthorStatuses ?? []).filter(({ confirmed }) => !confirmed).length > 0;
}

function scheduleCoauthoredPost<T extends Partial<DbPost>>(post: T): T {
  const now = new Date();
  post.postedAt = new Date(now.setDate(now.getDate() + 1));
  post.isFuture = true;
  return post;
}

export async function scheduleCoauthoredPostWithUnconfirmedCoauthors(post: DbPost): Promise<DbPost> {
  if (postHasUnconfirmedCoauthors(post) && !post.draft) {
    post = scheduleCoauthoredPost(post);
  }
  return post;
}

export function addLinkSharingKey(post: DbPost): DbPost {
  return {
    ...post,
    linkSharingKey: generateLinkSharingKey()
  };
}

/* CREATE AFTER */
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

export async function applyNewPostTags(post: DbPost, props: CreateCallbackProperties<"Posts">) {
  const {currentUser, context} = props;
  if (!currentUser) return post; // Shouldn't happen, but just in case
  
  if (post.tagRelevance) {
    // Convert tag relevances in a new-post submission to creating new TagRel objects, and upvoting them.
    const tagsToApply = Object.keys(post.tagRelevance);
    post = {...post, tagRelevance: undefined};
    await bulkApplyPostTags({postId: post._id, tagsToApply, currentUser, context})
  }

  return post;
}

export async function createNewJargonTermsCallback(post: DbPost, callbackProperties: CreateCallbackProperties<"Posts">) {
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

/* NEW AFTER */
export async function sendCoauthorRequestNotifications(post: DbPost, callbackProperties: AfterCreateCallbackProperties<'Posts'>) {
  const { context: { Posts } } = callbackProperties;
  const { _id, coauthorStatuses, hasCoauthorPermission } = post;

  if (hasCoauthorPermission === false && coauthorStatuses?.length) {
    await createNotifications({
      userIds: coauthorStatuses.filter(({requested, confirmed}) => !requested && !confirmed).map(({userId}) => userId),
      notificationType: "coauthorRequestNotification",
      documentType: "post",
      documentId: _id,
    });

    post.coauthorStatuses = coauthorStatuses.map((status) => ({ ...status, requested: true }));
    await Posts.rawUpdateOne({ _id }, { $set: { coauthorStatuses: post.coauthorStatuses } });
  }

  return post;
}

export async function lwPostsNewUpvoteOwnPost(post: DbPost, callbackProperties: AfterCreateCallbackProperties<'Posts'>): Promise<DbPost> {
  const { context: { Users, Posts } } = callbackProperties;

  const postAuthor = await Users.findOne(post.userId);
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
}

export function postsNewPostRelation(post: DbPost, callbackProperties: AfterCreateCallbackProperties<'Posts'>) {
  const { context: { PostRelations } } = callbackProperties;
  
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
}

// Use the first image in the post as the social preview image
export async function extractSocialPreviewImage(post: DbPost, callbackProperties: AfterCreateCallbackProperties<'Posts'>) {
  const { context: { Posts } } = callbackProperties;
  
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

/* CREATE ASYNC */
export async function notifyUsersAddedAsPostCoauthors({ document: post }: AfterCreateCallbackProperties<'Posts'>) {
  const coauthorIds: Array<string> = getConfirmedCoauthorIds(post);
  await createNotifications({ userIds: coauthorIds, notificationType: "addedAsCoauthor", documentType: "post", documentId: post._id });
}

export async function triggerReviewForNewPostIfNeeded({ document }: AfterCreateCallbackProperties<"Posts">) {
  if (!document.draft) {
    await triggerReviewIfNeeded(document.userId)
  }
}

async function autoReview(post: DbPost, context: ResolverContext): Promise<void> {
  const api = await getOpenAI();
  if (!api) {
    if (!isAnyTest && !isE2E) {
      //eslint-disable-next-line no-console
      console.log("Skipping autotagging (API not configured)");
    }
    return;
  }
  const tagBot = await getTagBotAccount(context);
  const tagBotActiveTime = tagBotActiveTimeSetting.get();

  if (!tagBot || (tagBotActiveTime === "weekends" && !isWeekend())) {
    //eslint-disable-next-line no-console
    console.log(`Skipping autotagging (${!tagBot ? "no tag-bot account" : "not a weekend"})`);
    return;
  }
  
  const tags = await getAutoAppliedTags();
  const postHTML = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: post._id},
    currentUser: context.currentUser,
    context,
    skipFiltering: true,
  });
  if (!postHTML) {
    return;
  }
  const tagsApplied = await checkTags(postHTML, tags, api);
  
  //eslint-disable-next-line no-console
  console.log(`Auto-applying tags to post ${post.title} (${post._id}): ${JSON.stringify(tagsApplied)}`);
  
  for (let tag of tags) {
    if (tagsApplied[tag.slug]) {
      await addOrUpvoteTag({
        tagId: tag._id,
        postId: post._id,
        currentUser: tagBot,
        context,
      });
    }
  }

  const autoFrontpageEnabled = autoFrontpageSetting.get()
  if (!autoFrontpageEnabled) {
    return;
  }

  const requireFrontpageReview = requireReviewToFrontpagePostsSetting.get();
  const defaultFrontpageHide = requireFrontpageReview || !eaFrontpageDateDefault(
    post.isEvent,
    post.submitToFrontpage,
    post.draft,
  )
  if (requireFrontpageReview !== defaultFrontpageHide) {
    // The common case this is designed for: requireFrontpageReview is `false` but submitToFrontpage is also `false` (so
    // defaultFrontpageHide is `true`), so the post is already hidden and there is no need to auto-review
    return
  }

  const autoFrontpageReview = await checkFrontpage(postHTML, api);

  // eslint-disable-next-line no-console
  console.log(
    `Frontpage auto-review result for ${post.title} (${post._id}): ${
      autoFrontpageReview ? (defaultFrontpageHide ? "Show" : "Hide") : "No action"
    }`
  );

  if (autoFrontpageReview) {
    await updateMutator({
      collection: Posts,
      documentId: post._id,
      data: {
        frontpageDate: defaultFrontpageHide ? new Date() : null,
        autoFrontpage: defaultFrontpageHide ? "show" : "hide"
      },
      currentUser: context.currentUser,
      context,
    });
  }
}

export async function autoReviewNewPost({ document, context }: AfterCreateCallbackProperties<"Posts">) {
  if (!document.draft) {
    // Post created (and is not a draft)
    void autoReview(document, context);
  }
}

/* UPDATE VALIDATE */
export async function postsUndraftRateLimit(validationErrors: CallbackValidationErrors, { oldDocument, newDocument, currentUser }: UpdateCallbackProperties<'Posts'>) {
  // Only undrafting is rate limited, not other edits
  if (oldDocument.draft && !newDocument.draft && !newDocument.isEvent) {
    await enforcePostRateLimit(currentUser!);
  }
  return validationErrors;
}

/* UPDATE BEFORE */

// TODO: check the order of this function in the updateBefore callbacks
export function onEditAddLinkSharingKey(data: Partial<DbPost>, { oldDocument }: UpdateCallbackProperties<'Posts'>): Partial<DbPost> {
  if (!oldDocument.linkSharingKey) {
    return {
      ...data,
      linkSharingKey: generateLinkSharingKey()
    };
  } else {
    return data;
  }
}

export function setPostUndraftedFields(data: Partial<DbPost>, { oldDocument: post }: UpdateCallbackProperties<'Posts'>) {
  // Set postedAt and wasEverUndrafted when a post is moved out of drafts.
  // If the post has previously been published then moved to drafts, and now
  // it's being republished then we shouldn't reset the `postedAt` date.
  const isRepublish = post.wasEverUndrafted || data.wasEverUndrafted;
  if (data.draft === false && post.draft && !isRepublish) {
    data.postedAt = new Date();
    data.wasEverUndrafted = true;
  }
  return data;
}

// TODO: this, plus the scheduleCoauthoredPost function, should probably be converted to one of the on-publish callbacks?
export function scheduleCoauthoredPostWhenUndrafted(post: Partial<DbPost>, {oldDocument: oldPost, newDocument: newPost}: UpdateCallbackProperties<"Posts">) {
  // Here we schedule the post for 1-day in the future when publishing an existing draft with unconfirmed coauthors
  // We must check post.draft === false instead of !post.draft as post.draft may be undefined in some cases
  // NOTE: EA FORUM: this used to use `post` rather than `newPost`, but `post` is merely the diff, which isn't what you want to pass into those
  if (postHasUnconfirmedCoauthors(newPost) && post.draft === false && oldPost.draft) {
    post = scheduleCoauthoredPost(post);
  }
  return post;
}

/* EDIT SYNC */
export function clearCourseEndTime(modifier: MongoModifier<DbPost>, post: DbPost): MongoModifier<DbPost> {
  // make sure courses/programs have no end time
  // (we don't want them listed for the length of the course, just until the application deadline / start time)
  if (post.eventType === 'course') {
    modifier.$set.endTime = null;
  }
  
  return modifier
}

export function removeFrontpageDate(modifier: MongoModifier<DbPost>, _post: DbPost): MongoModifier<DbPost> {
  if (
    modifier.$set?.submitToFrontpage === false ||
    modifier.$set?.submitToFrontpage === null ||
    modifier.$unset?.submitToFrontpage
  ) {
    modifier.$unset ??= {};
    modifier.$unset.frontpageDate = 1;
  }
  return modifier;
}

export function resetPostApprovedDate(modifier: MongoModifier<DbPost>, post: DbPost): MongoModifier<DbPost> {
  if (modifier.$set && postIsApproved(modifier.$set) && !postIsApproved(post)) {
    modifier.$set.postedAt = new Date();
  }
  return modifier;
}
