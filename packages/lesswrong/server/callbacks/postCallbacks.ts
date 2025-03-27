import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { swrInvalidatePostRoute } from '../cache/swr';
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from '../embeddings';
import { handleCrosspostUpdate, performCrosspost } from "../fmCrosspost/crosspost";
import { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { rehostPostMetaImages } from '../scripts/convertImagesToCloudinary';
import { moveToAFUpdatesUserAFKarma } from './alignment-forum/callbacks';
import { addLinkSharingKey, addReferrerToPost, applyNewPostTags, assertPostTitleHasNoEmojis, autoTagNewPost, autoTagUndraftedPost, checkRecentRepost, checkTosAccepted, clearCourseEndTime, createNewJargonTermsCallback, debateMustHaveCoauthor, eventUpdatedNotifications, extractSocialPreviewImage, fixEventStartAndEndTimes, lwPostsNewUpvoteOwnPost, notifyUsersAddedAsCoauthors, notifyUsersAddedAsPostCoauthors, oldPostsLastCommentedAt, onEditAddLinkSharingKey, onPostPublished, postsNewDefaultLocation, postsNewDefaultTypes, postsNewPostRelation, postsNewRateLimit, postsNewUserApprovedStatus, postsUndraftRateLimit, removeFrontpageDate, removeRedraftNotifications, resetDialogueMatches, resetPostApprovedDate, scheduleCoauthoredPostWhenUndrafted, scheduleCoauthoredPostWithUnconfirmedCoauthors, sendAlignmentSubmissionApprovalNotifications, sendCoauthorRequestNotifications, sendEAFCuratedAuthorsNotification, sendLWAFPostCurationEmails, sendNewPublishedDialogueMessageNotifications, sendPostApprovalNotifications, sendPostSharedWithUserNotifications, sendRejectionPM, sendUsersSharedOnPostNotifications, setPostUndraftedFields, syncTagRelevance, triggerReviewForNewPostIfNeeded, updateCommentHideKarma, updatedPostMaybeTriggerReview, updateFirstDebateCommentPostId, updatePostEmbeddingsOnChange, updatePostShortform, updateRecombeePost, updateUserNotesOnPostDraft, updateUserNotesOnPostRejection } from './postCallbackFunctions';

async function postCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Posts'>): Promise<CallbackValidationErrors> {
  debateMustHaveCoauthor(validationErrors, props);
  await postsNewRateLimit(validationErrors, props);

  return validationErrors;
}

async function postCreateBefore(doc: Partial<DbInsertion<DbPost>>, props: CreateCallbackProperties<'Posts'>): Promise<Partial<DbInsertion<DbPost>>> {  
  let mutablePost = doc;

  mutablePost = addReferrerToPost(mutablePost, props) ?? mutablePost;
  
  return mutablePost;
}

async function postNewSync(post: Partial<DbInsertion<DbPost>>, currentUser: DbUser | null, context: ResolverContext): Promise<Partial<DbInsertion<DbPost>>> {
  // TODO: add forum-gated EA forum callbacks
  if (isEAForum) {
    // TODO: were the errors thrown by these previously being swallowed?
    post = checkTosAccepted(currentUser, post);
    assertPostTitleHasNoEmojis(post);
  }

  post = await checkRecentRepost(post, currentUser, context);
  post = await postsNewDefaultLocation(post, currentUser, context);
  post = await postsNewDefaultTypes(post, currentUser, context);
  post = await postsNewUserApprovedStatus(post, currentUser, context);
  post = await fixEventStartAndEndTimes(post);
  post = await scheduleCoauthoredPostWithUnconfirmedCoauthors(post);
  post = await performCrosspost(post);
  post = addLinkSharingKey(post);

  return post;
}

async function postCreateAfter(post: DbPost, props: AfterCreateCallbackProperties<'Posts'>): Promise<DbPost> {
  await swrInvalidatePostRoute(post._id);
  if (!post.authorIsUnreviewed && !post.draft) {
    void onPostPublished(post, props.context);
  }
  post = await applyNewPostTags(post, props);
  post = await createNewJargonTermsCallback(post, props);
  post = await updateFirstDebateCommentPostId(post, props);

  return post;
}

async function postNewAfter(post: DbPost, currentUser: DbUser | null, props: AfterCreateCallbackProperties<'Posts'>): Promise<DbPost> {
  post = await sendCoauthorRequestNotifications(post, props);
  post = await lwPostsNewUpvoteOwnPost(post, props);
  post = postsNewPostRelation(post, props);
  post = await extractSocialPreviewImage(post, props);

  return post;
}

async function postCreateAsync(props: AfterCreateCallbackProperties<'Posts'>) {
  await notifyUsersAddedAsPostCoauthors(props);
  await triggerReviewForNewPostIfNeeded(props);
  await autoTagNewPost(props);
}

async function postNewAsync(post: DbPost) {
  await sendUsersSharedOnPostNotifications(post);
  if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
    await updatePostEmbeddingsOnChange(post, undefined);
  }

  // This used to be an editable callback, but it only needs to run once, rather than once per field
  await rehostPostMetaImages(post);
}

async function postUpdateValidate(validationErrors: CallbackValidationErrors, props: UpdateCallbackProperties<'Posts'>): Promise<CallbackValidationErrors> {
  validationErrors = await postsUndraftRateLimit(validationErrors, props);
  return validationErrors;
}

async function postUpdateBefore(post: Partial<DbPost>, props: UpdateCallbackProperties<'Posts'>): Promise<Partial<DbPost>> {
  if (isEAForum) {
    post = checkTosAccepted(props.currentUser, post);
    assertPostTitleHasNoEmojis(post);
  }

  // Explicitly don't assign back to partial post here, since it returns the value fetched from the database
  await checkRecentRepost(props.newDocument, props.currentUser, props.context);
  post = setPostUndraftedFields(post, props);
  post = scheduleCoauthoredPostWhenUndrafted(post, props);
  post = await handleCrosspostUpdate(post, props);
  post = onEditAddLinkSharingKey(post, props);

  return post;
}

async function postEditSync(modifier: MongoModifier<DbPost>, post: DbPost): Promise<MongoModifier<DbPost>> {
  modifier = clearCourseEndTime(modifier, post);
  modifier = removeFrontpageDate(modifier, post);
  modifier = resetPostApprovedDate(modifier, post);
  return modifier;
}

async function postUpdateAfter(post: DbPost, props: UpdateCallbackProperties<'Posts'>): Promise<DbPost> {
  await swrInvalidatePostRoute(post._id);
  post = await sendCoauthorRequestNotifications(post, props);
  post = await syncTagRelevance(post, props);
  post = await resetDialogueMatches(post, props);
  post = await createNewJargonTermsCallback(post, props);

  return post;
}

async function postUpdateAsync(props: UpdateCallbackProperties<'Posts'>) {
  await eventUpdatedNotifications(props);
  await notifyUsersAddedAsCoauthors(props);
  await updatePostEmbeddingsOnChange(props.newDocument, props.oldDocument);
  await updatedPostMaybeTriggerReview(props);
  await sendRejectionPM(props);
  await updateUserNotesOnPostDraft(props);
  await updateUserNotesOnPostRejection(props);
  await updateRecombeePost(props);
  await autoTagUndraftedPost(props);
}

async function postEditAsync(post: DbPost, oldPost: DbPost, currentUser: DbUser | null, collection: CollectionBase<'Posts'>, props: UpdateCallbackProperties<'Posts'>) {
  const { context } = props;

  await moveToAFUpdatesUserAFKarma(post, oldPost);
  sendPostApprovalNotifications(post, oldPost);
  await sendNewPublishedDialogueMessageNotifications(post, oldPost, context);
  await removeRedraftNotifications(post, oldPost, context);

  if (isEAForum) {
    await sendEAFCuratedAuthorsNotification(post, oldPost, context);
  }

  if (isLWorAF) {
    await sendLWAFPostCurationEmails(post, oldPost);
  }

  await sendPostSharedWithUserNotifications(post, oldPost);
  await sendAlignmentSubmissionApprovalNotifications(post, oldPost);
  await updatePostShortform(post, oldPost, context);
  await updateCommentHideKarma(post, oldPost, context);
  await extractSocialPreviewImage(post, props);
  await oldPostsLastCommentedAt(post, context);
}

getCollectionHooks('Posts').createValidate.add(postCreateValidate);
getCollectionHooks('Posts').createBefore.add(postCreateBefore);
getCollectionHooks('Posts').newSync.add(postNewSync);
getCollectionHooks('Posts').createAfter.add(postCreateAfter);
getCollectionHooks('Posts').newAfter.add(postNewAfter);
getCollectionHooks('Posts').createAsync.add(postCreateAsync);
getCollectionHooks('Posts').newAsync.add(postNewAsync);

getCollectionHooks('Posts').updateValidate.add(postUpdateValidate);
getCollectionHooks('Posts').updateBefore.add(postUpdateBefore);
getCollectionHooks('Posts').editSync.add(postEditSync);
getCollectionHooks('Posts').updateAfter.add(postUpdateAfter);
getCollectionHooks('Posts').updateAsync.add(postUpdateAsync);
getCollectionHooks('Posts').editAsync.add(postEditAsync);
