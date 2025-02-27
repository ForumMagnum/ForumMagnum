import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { swrInvalidatePostRoute } from '../cache/swr';
import { EditableCallbackProperties } from '../editor/make_editable_callbacks';
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from '../embeddings';
import { handleCrosspostUpdate, performCrosspost } from "../fmCrosspost/crosspost";
import { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { moveToAFUpdatesUserAFKarma } from './alignment-forum/callbacks';
import { addLinkSharingKey, addReferrerToPost, applyNewPostTags, assertPostTitleHasNoEmojis, autoTagNewPost, autoTagUndraftedPost, checkRecentRepost, checkTosAccepted, clearCourseEndTime, createNewJargonTermsCallback, debateMustHaveCoauthor, eventUpdatedNotifications, extractSocialPreviewImage, fixEventStartAndEndTimes, lwPostsNewUpvoteOwnPost, notifyUsersAddedAsCoauthors, notifyUsersAddedAsPostCoauthors, oldPostsLastCommentedAt, onEditAddLinkSharingKey, onPostPublished, postsNewDefaultLocation, postsNewDefaultTypes, postsNewPostRelation, postsNewRateLimit, postsNewUserApprovedStatus, postsUndraftRateLimit, removeFrontpageDate, removeRedraftNotifications, resetDialogueMatches, resetPostApprovedDate, scheduleCoauthoredPostWhenUndrafted, scheduleCoauthoredPostWithUnconfirmedCoauthors, sendAlignmentSubmissionApprovalNotifications, sendCoauthorRequestNotifications, sendEAFCuratedAuthorsNotification, sendLWAFPostCurationEmails, sendNewPublishedDialogueMessageNotifications, sendPostApprovalNotifications, sendPostSharedWithUserNotifications, sendRejectionPM, sendUsersSharedOnPostNotifications, setPostUndraftedFields, syncTagRelevance, triggerReviewForNewPostIfNeeded, updateCommentHideKarma, updatedPostMaybeTriggerReview, updatePostEmbeddingsOnChange, updatePostShortform, updateRecombeePost, updateUserNotesOnPostDraft, updateUserNotesOnPostRejection } from './postCallbackFunctions';


// TODO: refactor these in some way similar to countOfReferences callbacks?
// post slug callbacks
// const { slugCreateBeforeCallbackFunction, slugUpdateBeforeCallbackFunction } = getSlugCallbacks<'Posts'>({
//   collection: Posts,
//   getTitle: (post) => post.title,
//   includesOldSlugs: false,
//   collectionsToAvoidCollisionsWith: ['Posts'],
//   onCollision: 'newDocumentGetsSuffix',
// });

// TODO: refactor these in some way similar to countOfReferences callbacks?
// post `contents` callbacks
// const postContentsEditableCallbackOptions = {
//   fieldName: 'contents',
//   collectionName: 'Posts',
//   normalized: true,
//   pingbacks: true,
// } as const;

// const postModerationGuidelinesEditableCallbackOptions = {
//   fieldName: 'moderationGuidelines',
//   collectionName: 'Posts',
//   normalized: true,
//   pingbacks: false,
// } as const;

// const postCustomHighlightEditableCallbackOptions = {
//   fieldName: 'customHighlight',
//   collectionName: 'Posts',
//   normalized: false,
//   pingbacks: false,
// } as const;

async function postCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Posts'>): Promise<CallbackValidationErrors> {
  debateMustHaveCoauthor(validationErrors, props);
  await postsNewRateLimit(validationErrors, props);

  return validationErrors;
}

async function postCreateBefore(doc: DbInsertion<DbPost>, props: CreateCallbackProperties<'Posts'>): Promise<DbInsertion<DbPost>> {  
  let mutablePost = doc;

  // mutablePost = await slugCreateBeforeCallbackFunction(mutablePost, props);
  mutablePost = addReferrerToPost(mutablePost, props) ?? mutablePost;
  
  // mutablePost = await editorSerializationBeforeCreate(mutablePost, props, postContentsEditableCallbackOptions);
  // mutablePost = await editorSerializationBeforeCreate(mutablePost, props, postModerationGuidelinesEditableCallbackOptions);
  // mutablePost = await editorSerializationBeforeCreate(mutablePost, props, postCustomHighlightEditableCallbackOptions);

  return mutablePost;
}

async function postNewSync(post: DbPost, currentUser: DbUser | null, context: ResolverContext): Promise<DbPost> {
  // TODO: add forum-gated EA forum callbacks
  if (isEAForum) {
    // TODO: were the errors thrown by these previously being swallowed?
    post = checkTosAccepted(currentUser, post);
    assertPostTitleHasNoEmojis(post);
  }

  post = await checkRecentRepost(post, currentUser, context);
  post = await postsNewDefaultLocation(post);
  post = await postsNewDefaultTypes(post, currentUser, context);
  post = await postsNewUserApprovedStatus(post, currentUser, context);
  post = await fixEventStartAndEndTimes(post);
  post = await scheduleCoauthoredPostWithUnconfirmedCoauthors(post);
  post = await performCrosspost(post);
  post = addLinkSharingKey(post);

  return post;
}

// async function postCreateAfterEditableCallbacks(
//   post: DbPost,
//   props: AfterCreateCallbackProperties<'Posts'>,
//   editableCallbackOptions: EditableCallbackProperties<'Posts'>
// ): Promise<DbPost> {
//   post = await editorSerializationAfterCreate(post, props, editableCallbackOptions);
//   post = await notifyUsersAboutPingbackMentionsInCreate(post, props, editableCallbackOptions);
//   if (editableCallbackOptions.fieldName === 'contents') {
//     post = await updateFirstDebateCommentPostId(post, props);
//   }

//   return post;
// }

async function postCreateAfter(post: DbPost, props: AfterCreateCallbackProperties<'Posts'>): Promise<DbPost> {
  await swrInvalidatePostRoute(post._id);
  if (!post.authorIsUnreviewed && !post.draft) {
    void onPostPublished(post, props.context);
  }
  post = await applyNewPostTags(post, props);
  post = await createNewJargonTermsCallback(post, props);

  // post editable fields callbacks
  // post = await postCreateAfterEditableCallbacks(post, props, postContentsEditableCallbackOptions);
  // post = await postCreateAfterEditableCallbacks(post, props, postModerationGuidelinesEditableCallbackOptions);
  // post = await postCreateAfterEditableCallbacks(post, props, postCustomHighlightEditableCallbackOptions);

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

  // elastic callback
  await elasticSyncDocument('Posts', props.document._id);
}

async function postNewAsync(post: DbPost) {
  await sendUsersSharedOnPostNotifications(post);
  if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
    await updatePostEmbeddingsOnChange(post, undefined);
  }

  // post editable fields callbacks
  // await reuploadImagesInNew(post, postContentsEditableCallbackOptions);
  // await reuploadImagesInNew(post, postModerationGuidelinesEditableCallbackOptions);
  // await reuploadImagesInNew(post, postCustomHighlightEditableCallbackOptions);

  // This editable callback only needs to run once, not once per field, since it's not field-specific
  // await rehostPostMetaImagesInNew(post);
}

async function postUpdateValidate(validationErrors: CallbackValidationErrors, props: UpdateCallbackProperties<'Posts'>): Promise<CallbackValidationErrors> {
  validationErrors = await postsUndraftRateLimit(validationErrors, props);
  return validationErrors;
}

async function postUpdateBefore(post: Partial<DbPost>, props: UpdateCallbackProperties<'Posts'>): Promise<Partial<DbPost>> {
  // TODO: add forum-gated EA forum callbacks
  if (isEAForum) {
    post = checkTosAccepted(props.currentUser, post);
    assertPostTitleHasNoEmojis(post);
  }

  // post = await slugUpdateBeforeCallbackFunction(post, props);

  // Explicitly don't assign back to partial post here, since it returns the value fetched from the database
  await checkRecentRepost(props.newDocument, props.currentUser, props.context);
  post = setPostUndraftedFields(post, props);
  post = scheduleCoauthoredPostWhenUndrafted(post, props);
  post = await handleCrosspostUpdate(post, props);
  post = onEditAddLinkSharingKey(post, props);

  // post editable fields callbacks
  // post = await editorSerializationEdit(post, props, postContentsEditableCallbackOptions);
  // post = await editorSerializationEdit(post, props, postModerationGuidelinesEditableCallbackOptions);
  // post = await editorSerializationEdit(post, props, postCustomHighlightEditableCallbackOptions);

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
  
  // post editable fields callbacks
  // post = await notifyUsersAboutPingbackMentionsInUpdate(post, props, postContentsEditableCallbackOptions);
  // post = await notifyUsersAboutPingbackMentionsInUpdate(post, props, postModerationGuidelinesEditableCallbackOptions);
  // post = await notifyUsersAboutPingbackMentionsInUpdate(post, props, postCustomHighlightEditableCallbackOptions);

  // countOfReference callbacks run after this

  return post;
}

// TODO: figure out where updatePostEmbeddingsOnChange should go in here
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
  await sendNewPublishedDialogueMessageNotifications(post, oldPost);
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

  // post editable fields callbacks
  // await reuploadImagesInEdit(post, oldPost, postContentsEditableCallbackOptions);
  // await reuploadImagesInEdit(post, oldPost, postModerationGuidelinesEditableCallbackOptions);
  // await reuploadImagesInEdit(post, oldPost, postCustomHighlightEditableCallbackOptions);

  // elastic callbacks
  await elasticSyncDocument('Posts', post._id);
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
