import { Posts } from '../../lib/collections/posts/collection';
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { swrInvalidatePostRoute } from '../cache/swr';
import { EditableCallbackProperties, editorSerializationAfterCreate, editorSerializationBeforeCreate, editorSerializationEdit, notifyUsersAboutPingbackMentionsInCreate, notifyUsersAboutPingbackMentionsInUpdate, rehostPostMetaImagesInNew, reuploadImagesInEdit, reuploadImagesInNew, updateFirstDebateCommentPostId } from '../editor/make_editable_callbacks';
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from '../embeddings';
import { handleCrosspostUpdate, performCrosspost } from "../fmCrosspost/crosspost";
import { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, UpdateCallbackProperties } from '../mutationCallbacks';
import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { getSlugCallbacks } from '../utils/slugUtil';
import { moveToAFUpdatesUserAFKarma } from './alignment-forum/callbacks';
import { addReferrerToPost, applyNewPostTags, assertPostTitleHasNoEmojis, autoTagNewPost, autoTagUndraftedPost, checkRecentRepost, checkTosAccepted, clearCourseEndTime, createNewJargonTermsCallback, debateMustHaveCoauthor, eventUpdatedNotifications, extractSocialPreviewImage, fixEventStartAndEndTimes, lwPostsNewUpvoteOwnPost, notifyUsersAddedAsCoauthors, notifyUsersAddedAsPostCoauthors, oldPostsLastCommentedAt, onEditAddLinkSharingKey, onPostPublished, postsNewDefaultLocation, postsNewDefaultTypes, postsNewPostRelation, postsNewRateLimit, postsNewUserApprovedStatus, postsUndraftRateLimit, removeFrontpageDate, removeRedraftNotifications, resetDialogueMatches, resetPostApprovedDate, scheduleCoauthoredPostWhenUndrafted, scheduleCoauthoredPostWithUnconfirmedCoauthors, sendAlignmentSubmissionApprovalNotifications, sendCoauthorRequestNotifications, sendEAFCuratedAuthorsNotification, sendLWAFPostCurationEmails, sendNewPublishedDialogueMessageNotifications, sendPostApprovalNotifications, sendPostSharedWithUserNotifications, sendRejectionPM, sendUsersSharedOnPostNotifications, setPostUndraftedFields, syncTagRelevance, triggerReviewForNewPostIfNeeded, updateCommentHideKarma, updatedPostMaybeTriggerReview, updatePostEmbeddingsOnChange, updatePostShortform, updateRecombeePost, updateUserNotesOnPostDraft, updateUserNotesOnPostRejection } from './postCallbackFunctions';


// TODO: refactor these in some way similar to countOfReferences callbacks?
// post slug callbacks
const { slugCreateBeforeCallbackFunction, slugUpdateBeforeCallbackFunction } = getSlugCallbacks<'Posts'>({
  collection: Posts,
  getTitle: (post) => post.title,
  includesOldSlugs: false,
  collectionsToAvoidCollisionsWith: ['Posts'],
  onCollision: 'newDocumentGetsSuffix',
});

// TODO: refactor these in some way similar to countOfReferences callbacks?
// post `contents` callbacks
const postContentsEditableCallbackOptions = {
  fieldName: 'contents',
  collectionName: 'Posts',
  normalized: true,
  pingbacks: true,
} as const;

const postModerationGuidelinesEditableCallbackOptions = {
  fieldName: 'moderationGuidelines',
  collectionName: 'Posts',
  normalized: true,
  pingbacks: false,
} as const;

const postCustomHighlightEditableCallbackOptions = {
  fieldName: 'customHighlight',
  collectionName: 'Posts',
  normalized: false,
  pingbacks: false,
} as const;

async function postCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Posts'>): Promise<CallbackValidationErrors> {
  debateMustHaveCoauthor(validationErrors, props);
  await postsNewRateLimit(validationErrors, props);

  return validationErrors;
}

async function postCreateBefore(doc: DbInsertion<DbPost>, props: CreateCallbackProperties<'Posts'>): Promise<DbInsertion<DbPost>> {  
  let mutablePost = doc;

  mutablePost = await slugCreateBeforeCallbackFunction(mutablePost, props);
  mutablePost = addReferrerToPost(mutablePost, props) ?? mutablePost;
  
  mutablePost = await editorSerializationBeforeCreate(mutablePost, props, postContentsEditableCallbackOptions);
  mutablePost = await editorSerializationBeforeCreate(mutablePost, props, postModerationGuidelinesEditableCallbackOptions);
  mutablePost = await editorSerializationBeforeCreate(mutablePost, props, postCustomHighlightEditableCallbackOptions);

  return mutablePost;
}

// TODO: figure out where updatePostEmbeddingsOnCreate should go
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
  return post;
}

async function postCreateAfterEditableCallbacks(
  post: DbPost,
  props: AfterCreateCallbackProperties<'Posts'>,
  editableCallbackOptions: EditableCallbackProperties<'Posts'>
): Promise<DbPost> {
  post = await editorSerializationAfterCreate(post, props, editableCallbackOptions);
  post = await notifyUsersAboutPingbackMentionsInCreate(post, props, editableCallbackOptions);
  if (editableCallbackOptions.fieldName === 'contents') {
    post = await updateFirstDebateCommentPostId(post, props);
  }
  return post;
}

async function postCreateAfter(post: DbPost, props: AfterCreateCallbackProperties<'Posts'>): Promise<DbPost> {
  await swrInvalidatePostRoute(post._id) ;
  if (!post.authorIsUnreviewed && !post.draft) {
    void onPostPublished(post, props.context);
  }
  post = await applyNewPostTags(post, props);
  post = await createNewJargonTermsCallback(post, props);

  // post editable fields callbacks
  post = await postCreateAfterEditableCallbacks(post, props, postContentsEditableCallbackOptions);
  post = await postCreateAfterEditableCallbacks(post, props, postModerationGuidelinesEditableCallbackOptions);
  post = await postCreateAfterEditableCallbacks(post, props, postCustomHighlightEditableCallbackOptions);
  
  // NOTE: newAfter callbacks that were moved into createAfter
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

  // NOTE: newAsync callbacks that were moved into createAsync
  await sendUsersSharedOnPostNotifications(props);
  if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
    await updatePostEmbeddingsOnChange(props.document, undefined);
  }

  // post editable fields callbacks
  await reuploadImagesInNew(props.document, postContentsEditableCallbackOptions);
  await reuploadImagesInNew(props.document, postModerationGuidelinesEditableCallbackOptions);
  await reuploadImagesInNew(props.document, postCustomHighlightEditableCallbackOptions);

  // This editable callback only needs to run once, not once per field, since it's not field-specific
  await rehostPostMetaImagesInNew(props.document);
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

  post = await slugUpdateBeforeCallbackFunction(post, props);
  post = onEditAddLinkSharingKey(post, props);
  // Explicitly don't assign back to partial post here, since it returns the value fetched from the database
  await checkRecentRepost(props.newDocument, props.currentUser, props.context);
  post = setPostUndraftedFields(post, props);
  post = scheduleCoauthoredPostWhenUndrafted(post, props);
  post = await handleCrosspostUpdate(post, props);

  // post editable fields callbacks
  post = await editorSerializationEdit(post, props, postContentsEditableCallbackOptions);
  post = await editorSerializationEdit(post, props, postModerationGuidelinesEditableCallbackOptions);
  post = await editorSerializationEdit(post, props, postCustomHighlightEditableCallbackOptions);

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
  post = await notifyUsersAboutPingbackMentionsInUpdate(post, props, postContentsEditableCallbackOptions);
  post = await notifyUsersAboutPingbackMentionsInUpdate(post, props, postModerationGuidelinesEditableCallbackOptions);
  post = await notifyUsersAboutPingbackMentionsInUpdate(post, props, postCustomHighlightEditableCallbackOptions);

  return post;
}

// TODO: figure out where updatePostEmbeddingsOnChange should go in here
async function postUpdateAsync(props: UpdateCallbackProperties<'Posts'>) {
  await eventUpdatedNotifications(props);
  await notifyUsersAddedAsCoauthors(props);
  await autoTagUndraftedPost(props);
  await updatedPostMaybeTriggerReview(props);
  await sendRejectionPM(props);
  await updateUserNotesOnPostDraft(props);
  await updateUserNotesOnPostRejection(props);
  await updateRecombeePost(props);

  // NOTE: editAsync callbacks that were moved into updateAsync
  // Switched to using newDocument instead of document - sanity check that nothing horrible happens as a result
  await moveToAFUpdatesUserAFKarma(props.newDocument, props.oldDocument);
  sendPostApprovalNotifications(props.newDocument, props.oldDocument);
  await sendNewPublishedDialogueMessageNotifications(props.newDocument, props.oldDocument);
  await removeRedraftNotifications(props.newDocument, props.oldDocument, props.context);

  if (isEAForum) {
    await sendEAFCuratedAuthorsNotification(props.newDocument, props.oldDocument, props.context);
  }

  if (isLWorAF) {
    await sendLWAFPostCurationEmails(props.newDocument, props.oldDocument);
  }

  await sendPostSharedWithUserNotifications(props.newDocument, props.oldDocument);
  await sendAlignmentSubmissionApprovalNotifications(props.newDocument, props.oldDocument);
  await updatePostShortform(props.newDocument, props.oldDocument, props.context);
  await updateCommentHideKarma(props.newDocument, props.oldDocument, props.context);
  await extractSocialPreviewImage(props.newDocument, props);
  await oldPostsLastCommentedAt(props.newDocument, props.context);

  // post editable fields callbacks
  await reuploadImagesInEdit(props.newDocument, props.oldDocument, postContentsEditableCallbackOptions);
  await reuploadImagesInEdit(props.newDocument, props.oldDocument, postModerationGuidelinesEditableCallbackOptions);
  await reuploadImagesInEdit(props.newDocument, props.oldDocument, postCustomHighlightEditableCallbackOptions);

  // elastic callbacks
  await elasticSyncDocument('Posts', props.newDocument._id);
}
