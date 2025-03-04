
import { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, DeleteCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { addReferrerToComment, alignmentCommentsNewOperations, checkCommentForSpamWithAkismet, checkModGPTOnCommentCreate, checkModGPTOnCommentUpdate, commentsAlignmentEdit, commentsAlignmentNew, commentsEditSoftDeleteCallback, commentsNewNotifications, commentsNewOperations, commentsNewUserApprovedStatus, commentsPublishedNotifications, commentsRemovePostCommenters, commentsRemoveChildrenComments, createShortformPost, handleForumEventMetadataEdit, handleForumEventMetadataNew, handleReplyToAnswer, invalidatePostOnCommentCreate, invalidatePostOnCommentUpdate, lwCommentsNewUpvoteOwnComment, moveToAnswers, newCommentsEmptyCheck, newCommentsRateLimit, newCommentTriggerReview, setTopLevelCommentId, trackCommentRateLimitHit, updatedCommentMaybeTriggerReview, updateDescendentCommentCountsOnCreate, updateDescendentCommentCountsOnEdit, updateUserNotesOnCommentRejection, validateDeleteOperations } from './commentCallbackFunctions';
import { sendAlignmentSubmissionApprovalNotifications } from './postCallbackFunctions';


async function commentCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Comments'>): Promise<CallbackValidationErrors> {
  newCommentsEmptyCheck(validationErrors, props);
  await newCommentsRateLimit(validationErrors, props);

  return validationErrors;
}

async function commentCreateBefore(doc: DbInsertion<DbComment>, props: CreateCallbackProperties<'Comments'>): Promise<DbInsertion<DbComment>> {
  let mutableComment = doc;

  mutableComment = await createShortformPost(mutableComment, props);
  mutableComment = addReferrerToComment(mutableComment, props) ?? mutableComment;
  mutableComment = await handleReplyToAnswer(mutableComment, props);
  mutableComment = await setTopLevelCommentId(mutableComment, props);

  // editorSerializationBeforeCreate

  return mutableComment;
}

async function commentNewSync(comment: DbComment, currentUser: DbUser | null, context: ResolverContext): Promise<DbComment> {
  comment = await commentsNewOperations(comment, currentUser, context);
  comment = await commentsNewUserApprovedStatus(comment, context);
  comment = await handleForumEventMetadataNew(comment, context);

  return comment;
}

async function commentCreateAfter(comment: DbComment, props: AfterCreateCallbackProperties<'Comments'>): Promise<DbComment> {
  invalidatePostOnCommentCreate(comment);
  comment = await updateDescendentCommentCountsOnCreate(comment, props);

  // editorSerializationAfterCreate
  // notifyUsersAboutMentions

  // 12 countOfReferenceCallbacks

  return comment;
}

async function commentNewAfter(comment: DbComment, currentUser: DbUser | null, props: AfterCreateCallbackProperties<'Comments'>): Promise<DbComment> {
  comment = await lwCommentsNewUpvoteOwnComment(comment, currentUser, props);
  comment = await checkCommentForSpamWithAkismet(comment, currentUser, props);

  return comment;
}

async function commentCreateAsync(props: AfterCreateCallbackProperties<'Comments'>) {
  await newCommentTriggerReview(props);
  await trackCommentRateLimitHit(props);
  await checkModGPTOnCommentCreate(props);

  // Elastic callback
}

async function commentNewAsync(comment: DbComment, currentUser: DbUser | null, collection: CollectionBase<'Comments'>, props: AfterCreateCallbackProperties<'Comments'>) {
  // I'm pretty sure this is just a strict subset of the operations in commentsNewOperations
  // await alignmentCommentsNewOperations(comment, props.context);
  await commentsAlignmentNew(comment, props.context);
  await commentsNewNotifications(comment, props.context);

  // convertImagesInObject
}

async function commentUpdateValidate(validationErrors: CallbackValidationErrors, props: UpdateCallbackProperties<'Comments'>): Promise<CallbackValidationErrors> {
  return validationErrors;
}

async function commentUpdateBefore(comment: Partial<DbComment>, props: UpdateCallbackProperties<'Comments'>): Promise<Partial<DbComment>> {
  comment = await validateDeleteOperations(comment, props);

  // editorSerializationEdit

  return comment;
}

async function commentEditSync(modifier: MongoModifier<DbComment>, comment: DbComment, _0: DbUser | null, _1: DbComment, props: UpdateCallbackProperties<'Comments'>): Promise<MongoModifier<DbComment>> {
  modifier = await moveToAnswers(modifier, comment, props.context);
  modifier = await handleForumEventMetadataEdit(modifier, comment, props.context);

  return modifier;
}

async function commentUpdateAfter(comment: DbComment, props: UpdateCallbackProperties<'Comments'>): Promise<DbComment> {
  invalidatePostOnCommentUpdate(comment);
  comment = await updateDescendentCommentCountsOnEdit(comment, props);

  // notifyUsersAboutMentions

  // 12 countOfReferenceCallbacks

  return comment;
}

async function commentUpdateAsync(props: UpdateCallbackProperties<'Comments'>) {
  await updatedCommentMaybeTriggerReview(props);
  await updateUserNotesOnCommentRejection(props);
  await checkModGPTOnCommentUpdate(props);
}

async function commentEditAsync(comment: DbComment, oldComment: DbComment, currentUser: DbUser | null, collection: CollectionBase<'Comments'>, props: UpdateCallbackProperties<'Comments'>) {
  await commentsAlignmentEdit(comment, oldComment, props.context);
  // There really has to be a currentUser here.
  await commentsEditSoftDeleteCallback(comment, oldComment, currentUser!, props.context);
  await commentsPublishedNotifications(comment, oldComment, props.context);
  await sendAlignmentSubmissionApprovalNotifications(comment, oldComment);

  // convertImagesInObject

  // Elastic callback
}

async function commentDeleteAsync(props: DeleteCallbackProperties<'Comments'>) {
  await commentsRemovePostCommenters(props);
  await commentsRemoveChildrenComments(props);

  // 12 countOfReferenceCallbacks
}

getCollectionHooks('Comments').createValidate.add(commentCreateValidate);
getCollectionHooks('Comments').createBefore.add(commentCreateBefore);
getCollectionHooks('Comments').newSync.add(commentNewSync);
getCollectionHooks('Comments').createAfter.add(commentCreateAfter);
getCollectionHooks('Comments').newAfter.add(commentNewAfter);
getCollectionHooks('Comments').createAsync.add(commentCreateAsync);
getCollectionHooks('Comments').newAsync.add(commentNewAsync);

getCollectionHooks('Comments').updateValidate.add(commentUpdateValidate);
getCollectionHooks('Comments').updateBefore.add(commentUpdateBefore);
getCollectionHooks('Comments').editSync.add(commentEditSync);
getCollectionHooks('Comments').updateAfter.add(commentUpdateAfter);
getCollectionHooks('Comments').updateAsync.add(commentUpdateAsync);
getCollectionHooks('Comments').editAsync.add(commentEditAsync);

getCollectionHooks('Comments').deleteAsync.add(commentDeleteAsync);
