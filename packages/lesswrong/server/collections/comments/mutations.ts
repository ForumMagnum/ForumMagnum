
import schema from "@/lib/collections/comments/newSchema";
import { userIsAllowedToComment } from "@/lib/collections/users/helpers";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { addReferrerToComment, assignPostVersion, checkCommentForSpamWithAkismet, checkModGPTOnCommentCreate, checkModGPTOnCommentUpdate, commentsAlignmentEdit, commentsAlignmentNew, commentsEditSoftDeleteCallback, commentsNewNotifications, commentsNewOperations, commentsNewUserApprovedStatus, commentsPublishedNotifications, createShortformPost, handleForumEventMetadataEdit, handleForumEventMetadataNew, handleReplyToAnswer, invalidatePostOnCommentCreate, invalidatePostOnCommentUpdate, lwCommentsNewUpvoteOwnComment, moveToAnswers, newCommentsEmptyCheck, newCommentsPollResponseCheck, newCommentsRateLimit, newCommentTriggerReview, handleDraftState, setTopLevelCommentId, trackCommentRateLimitHit, updatedCommentMaybeTriggerReview, updateDescendentCommentCountsOnCreate, updateDescendentCommentCountsOnEdit, updatePostLastCommentPromotedAt, updateUserNotesOnCommentRejection, validateDeleteOperations } from "@/server/callbacks/commentCallbackFunctions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { upsertPolls } from "@/server/callbacks/forumEventCallbacks";
import { sendAlignmentSubmissionApprovalNotifications } from "@/server/callbacks/sharedCallbackFunctions";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds, notifyUsersOfPingbackMentions } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { dataToModifier, modifierToData } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

async function newCheck(user: DbUser | null, document: CreateCommentDataInput | null, context: ResolverContext) {
  if (!user || !document) return false;
  
  newCommentsEmptyCheck(document);
  newCommentsPollResponseCheck(document);
  await newCommentsRateLimit(document, user, context);

  if (!document.postId) return userCanDo(user, 'comments.new')
  const post = await context.loaders.Posts.load(document.postId)
  if (!post) return true

  const author = await context.loaders.Users.load(post.userId);
  const isReply = !!document.parentCommentId;
  if (!userIsAllowedToComment(user, post, author, isReply)) {
    return userCanDo(user, `posts.moderate.all`)
  }

  return userCanDo(user, 'comments.new')
}

async function editCheck(user: DbUser | null, document: DbComment | null, context: ResolverContext) {
  if (!user || !document) return false;
  if (userCanDo(user, 'comments.alignment.move.all') ||
      userCanDo(user, 'comments.alignment.suggest')) {
    return true
  }
  return userOwns(user, document) ? userCanDo(user, 'comments.edit.own') : userCanDo(user, `comments.edit.all`)
}

export async function createComment({ data }: CreateCommentInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Comments', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await assignPostVersion(data);
  data = await createShortformPost(data, callbackProps);
  data = addReferrerToComment(data, callbackProps) ?? data;
  data = await handleReplyToAnswer(data, callbackProps);
  data = await setTopLevelCommentId(data, callbackProps);  

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  data = await commentsNewOperations(data, currentUser, context);
  data = await commentsNewUserApprovedStatus(data, context);
  data = await handleForumEventMetadataNew(data, context);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Comments', callbackProps);
  let documentWithId = afterCreateProperties.document;

  invalidatePostOnCommentCreate(documentWithId);
  documentWithId = await updateDescendentCommentCountsOnCreate(documentWithId, afterCreateProperties);  

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  documentWithId = await notifyUsersOfPingbackMentions({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await upsertPolls({
    revisionId: documentWithId.contents_latest,
    comment: documentWithId,
    context,
  })

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Comments', documentWithId);

  documentWithId = await lwCommentsNewUpvoteOwnComment(documentWithId, currentUser, afterCreateProperties);
  documentWithId = await checkCommentForSpamWithAkismet(documentWithId, currentUser, afterCreateProperties);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  await newCommentTriggerReview(asyncProperties);
  await trackCommentRateLimitHit(asyncProperties);
  await checkModGPTOnCommentCreate(asyncProperties);

  if (isElasticEnabled) {
    void elasticSyncDocument('Comments', documentWithId._id);
  }

  await commentsAlignmentNew(documentWithId, context);
  await commentsNewNotifications(documentWithId, context);

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateComment({ selector, data }: UpdateCommentInput, context: ResolverContext) {
  const { currentUser, Comments } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: commentSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Comments', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = updatePostLastCommentPromotedAt(data, updateCallbackProperties);
  data = handleDraftState(data, updateCallbackProperties);
  data = await validateDeleteOperations(data, updateCallbackProperties);  

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let modifier = dataToModifier(data);
  modifier = await moveToAnswers(modifier, oldDocument, context);
  modifier = await handleForumEventMetadataEdit(modifier, oldDocument, context);

  data = modifierToData(modifier);
  let updatedDocument = await updateAndReturnDocument(data, Comments, commentSelector, context);

  invalidatePostOnCommentUpdate(updatedDocument);
  updatedDocument = await updateDescendentCommentCountsOnEdit(updatedDocument, updateCallbackProperties);  

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await upsertPolls({
    revisionId: updatedDocument.contents_latest,
    comment: updatedDocument,
    context,
  })

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Comments', updatedDocument, oldDocument);

  await updatedCommentMaybeTriggerReview(updateCallbackProperties);
  await updateUserNotesOnCommentRejection(updateCallbackProperties);
  await checkModGPTOnCommentUpdate(updateCallbackProperties);  

  await commentsAlignmentEdit(updatedDocument, oldDocument, context);
  // There really has to be a currentUser here.
  await commentsEditSoftDeleteCallback(updatedDocument, oldDocument, currentUser!, context);
  await commentsPublishedNotifications(updatedDocument, oldDocument, context);
  await sendAlignmentSubmissionApprovalNotifications(updatedDocument, oldDocument);  

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  if (isElasticEnabled) {
    void elasticSyncDocument('Comments', updatedDocument._id);
  }

  void logFieldChanges({ currentUser, collection: Comments, oldDocument, data: origData });

  return updatedDocument;
}

export const createCommentGqlMutation = makeGqlCreateMutation('Comments', createComment, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Comments', rawResult, context)
});

export const updateCommentGqlMutation = makeGqlUpdateMutation('Comments', updateComment, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Comments', rawResult, context)
});




export const graphqlCommentTypeDefs = gql`
  input CreateCommentDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateCommentInput {
    data: CreateCommentDataInput!
  }
  
  input UpdateCommentDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateCommentInput {
    selector: SelectorInput!
    data: UpdateCommentDataInput!
  }
  
  type CommentOutput {
    data: Comment
  }

  extend type Mutation {
    createComment(data: CreateCommentDataInput!): CommentOutput
    updateComment(selector: SelectorInput!, data: UpdateCommentDataInput!): CommentOutput
  }
`;
