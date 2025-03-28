import { userCanPost } from "@/lib/collections/users/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { addLinkSharingKey, addReferrerToPost, applyNewPostTags, assertPostTitleHasNoEmojis, autoTagNewPost, autoTagUndraftedPost, checkRecentRepost, checkTosAccepted, clearCourseEndTime, createNewJargonTermsCallback, debateMustHaveCoauthor, eventUpdatedNotifications, extractSocialPreviewImage, fixEventStartAndEndTimes, lwPostsNewUpvoteOwnPost, notifyUsersAddedAsCoauthors, notifyUsersAddedAsPostCoauthors, oldPostsLastCommentedAt, onEditAddLinkSharingKey, onPostPublished, postsNewDefaultLocation, postsNewDefaultTypes, postsNewPostRelation, postsNewRateLimit, postsNewUserApprovedStatus, postsUndraftRateLimit, removeFrontpageDate, removeRedraftNotifications, resetDialogueMatches, resetPostApprovedDate, scheduleCoauthoredPostWhenUndrafted, scheduleCoauthoredPostWithUnconfirmedCoauthors, sendAlignmentSubmissionApprovalNotifications, sendCoauthorRequestNotifications, sendEAFCuratedAuthorsNotification, sendLWAFPostCurationEmails, sendNewPublishedDialogueMessageNotifications, sendPostApprovalNotifications, sendPostSharedWithUserNotifications, sendRejectionPM, sendUsersSharedOnPostNotifications, setPostUndraftedFields, syncTagRelevance, triggerReviewForNewPostIfNeeded, updateCommentHideKarma, updatedPostMaybeTriggerReview, updateFirstDebateCommentPostId, updatePostEmbeddingsOnChange, updatePostShortform, updateRecombeePost, updateUserNotesOnPostDraft, updateUserNotesOnPostRejection } from "@/server/callbacks/postCallbackFunctions";
import { AfterCreateCallbackProperties, UpdateCallbackProperties } from "@/server/mutationCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { throwError } from "@/server/vulcan-lib/errors";
import { assignUserIdToData, checkPermissionsAndReturnArguments, createAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, updateMutator } from "@/server/vulcan-lib/mutators";
import { performCheck } from "@/server/vulcan-lib/utils";
import { dataToModifier, validateData, validateDocument } from "@/server/vulcan-lib/validation";
import schema from "@/lib/collections/posts/newSchema";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { isEAForum, isElasticEnabled, isLWorAF } from "@/lib/instanceSettings";
import { handleCrosspostUpdate, performCrosspost } from "@/server/fmCrosspost/crosspost";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { swrInvalidatePostRoute } from "@/server/cache/swr";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from "@/server/embeddings";
import { rehostPostMetaImages } from "@/server/scripts/convertImagesToCloudinary";
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from "@/lib/collections/posts/helpers";
import { userCanDo, userIsMemberOf, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import isEmpty from "lodash/isEmpty";
import { convertDocumentIdToIdInSelector, UpdateSelector } from "@/lib/vulcan-lib/utils";
import cloneDeep from "lodash/cloneDeep";
import pickBy from "lodash/pickBy";
import clone from "lodash/clone";
import { moveToAFUpdatesUserAFKarma } from "@/server/callbacks/alignment-forum/callbacks";
import { logFieldChanges } from "@/server/fieldChanges";

async function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbPost>> | null, context: ResolverContext) {
  if (!user) return false;
  return userCanPost(user)
};

async function editCheck(user: DbUser|null, document: DbPost|null, context: ResolverContext) {
  if (!user || !document) return false;
  if (userCanDo(user, 'posts.alignment.move.all') ||
      userCanDo(user, 'posts.alignment.suggest') ||
      userIsMemberOf(user, 'canSuggestCuration')) {
    return true
  }

  return canUserEditPostMetadata(user, document) || userIsPodcaster(user) || await userIsPostGroupOrganizer(user, document, context)
  // note: we can probably get rid of the userIsPostGroupOrganizer call since that's now covered in canUserEditPostMetadata, but the implementation is slightly different and isn't otherwise part of the PR that restrutured canUserEditPostMetadata
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Posts', {
  createFunction: async (data, context) => {
    const { currentUser, Posts } = context;
    const operationName = 'post.create';
    await performCheck(
      newCheck,
      currentUser,
      data,
      context,
      '',
      operationName,
      'Posts'
    );

    const callbackProps = {
      collection: Posts,
      document: data,
      newDocument: data,
      currentUser: currentUser,
      context,
      schema,
    };

    // TODO: should validation be optional, the way it is with createMutator?
    // validation callbacks
    const validationErrors = validateDocument(data, Posts, context);
    if (validationErrors.length) {
      throwError({ id: 'app.validation_error', data: { break: true, errors: validationErrors } });
    }

    debateMustHaveCoauthor([], callbackProps);
    await postsNewRateLimit([], callbackProps);

    // assign userId
    assignUserIdToData(data, currentUser, schema);

    // onCreate callbacks
    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    // slug createBefore
    data = await runSlugCreateBeforeCallback(callbackProps);

    // createBefore
    data = addReferrerToPost(data, callbackProps);

    // runCreateBeforeEditableCallbacks
    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    // newSync
    if (isEAForum) {
      // TODO: were the errors thrown by these previously being swallowed?
      data = checkTosAccepted(currentUser, data);
      assertPostTitleHasNoEmojis(data);
    }
  
    data = await checkRecentRepost(data, currentUser, context);
    data = await postsNewDefaultLocation(data, currentUser, context);
    data = await postsNewDefaultTypes(data, currentUser, context);
    data = await postsNewUserApprovedStatus(data, currentUser, context);
    data = await fixEventStartAndEndTimes(data);
    data = await scheduleCoauthoredPostWithUnconfirmedCoauthors(data);
    data = await performCrosspost(data);
    data = addLinkSharingKey(data);  

    // insert into db
    const afterCreateProperties = await createAndReturnCreateAfterProps(data, 'Posts', callbackProps);
    let documentWithId = afterCreateProperties.document;

    // createAfter
    await swrInvalidatePostRoute(documentWithId._id);
    if (!documentWithId.authorIsUnreviewed && !documentWithId.draft) {
      void onPostPublished(documentWithId, context);
    }
    documentWithId = await applyNewPostTags(documentWithId, afterCreateProperties);
    documentWithId = await createNewJargonTermsCallback(documentWithId, afterCreateProperties);
    documentWithId = await updateFirstDebateCommentPostId(documentWithId, afterCreateProperties);
  
    // editable createAfter callbacks
    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    // runCountOfReferenceCallbacks
    await runCountOfReferenceCallbacks({
      collectionName: 'Posts',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // newAfter
    documentWithId = await sendCoauthorRequestNotifications(documentWithId, afterCreateProperties);
    documentWithId = await lwPostsNewUpvoteOwnPost(documentWithId, afterCreateProperties);
    documentWithId = postsNewPostRelation(documentWithId, afterCreateProperties);
    documentWithId = await extractSocialPreviewImage(documentWithId, afterCreateProperties);

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    // createAsync
    await notifyUsersAddedAsPostCoauthors(asyncProperties);
    await triggerReviewForNewPostIfNeeded(asyncProperties);
    await autoTagNewPost(asyncProperties);

    // elasticSync
    if (isElasticEnabled) {
      void elasticSyncDocument('Posts', documentWithId._id);
    }

    // newAsync
    await sendUsersSharedOnPostNotifications(documentWithId);
    if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
      await updatePostEmbeddingsOnChange(documentWithId, undefined);
    }
  
    await rehostPostMetaImages(documentWithId);

    // runNewAsyncEditableCallbacks
    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });
    
    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(context.currentUser, 'Posts', documentWithId, context);

    return filteredReturnValue;
  },
  updateFunction: async (selector, data, context) => {
    const { currentUser } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: postSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkPermissionsAndReturnArguments('Posts', { selector, context, data, editCheck, schema });

    const { collection: Posts, oldDocument } = updateCallbackProperties;

    // validation
    const validationErrors = validateData(data, previewDocument, Posts, context);
    if (validationErrors.length) {
      throwError({ id: 'app.validation_error', data: { break: true, errors: validationErrors } });
    }

    // validation callbacks
    await postsUndraftRateLimit([], updateCallbackProperties);

    // dataAsModifier
    const dataAsModifier = dataToModifier(clone(data));

    // onUpdate field callbacks
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    // runSlugUpdateBeforeCallback
    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    // updateBefore
    if (isEAForum) {
      data = checkTosAccepted(currentUser, data);
      assertPostTitleHasNoEmojis(data);
    }
  
    await checkRecentRepost(updateCallbackProperties.newDocument, currentUser, context);
    data = setPostUndraftedFields(data, updateCallbackProperties);
    data = scheduleCoauthoredPostWhenUndrafted(data, updateCallbackProperties);
    // Explicitly don't assign back to partial post here, since it returns the value fetched from the database
    // TODO: that above comment might be wrong, i'm confused about what's supposed to be happening here
    data = await handleCrosspostUpdate(data, updateCallbackProperties);
    data = onEditAddLinkSharingKey(data, updateCallbackProperties);

    // runUpdateBeforeEditableCallbacks
    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    // editSync
    let modifier = dataToModifier(data);
    modifier = clearCourseEndTime(modifier, oldDocument);
    modifier = removeFrontpageDate(modifier, oldDocument);
    modifier = resetPostApprovedDate(modifier, oldDocument);

    // DB Operation
    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Posts, postSelector, context) ?? previewDocument as DbPost;

    // updateAfter
    await swrInvalidatePostRoute(updatedDocument._id);
    updatedDocument = await sendCoauthorRequestNotifications(updatedDocument, updateCallbackProperties);
    updatedDocument = await syncTagRelevance(updatedDocument, updateCallbackProperties);
    updatedDocument = await resetDialogueMatches(updatedDocument, updateCallbackProperties);
    updatedDocument = await createNewJargonTermsCallback(updatedDocument, updateCallbackProperties);

    // runUpdateAfterEditableCallbacks
    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    // runCountOfReferenceCallbacks
    await runCountOfReferenceCallbacks({
      collectionName: 'Posts',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // updateAsync
    await eventUpdatedNotifications(updateCallbackProperties);
    await notifyUsersAddedAsCoauthors(updateCallbackProperties);
    await updatePostEmbeddingsOnChange(updateCallbackProperties.newDocument, updateCallbackProperties.oldDocument);
    await updatedPostMaybeTriggerReview(updateCallbackProperties);
    await sendRejectionPM(updateCallbackProperties);
    await updateUserNotesOnPostDraft(updateCallbackProperties);
    await updateUserNotesOnPostRejection(updateCallbackProperties);
    await updateRecombeePost(updateCallbackProperties);
    await autoTagUndraftedPost(updateCallbackProperties);

    // editAsync
    await moveToAFUpdatesUserAFKarma(updatedDocument, oldDocument);
    sendPostApprovalNotifications(updatedDocument, oldDocument);
    await sendNewPublishedDialogueMessageNotifications(updatedDocument, oldDocument, context);
    await removeRedraftNotifications(updatedDocument, oldDocument, context);
  
    if (isEAForum) {
      await sendEAFCuratedAuthorsNotification(updatedDocument, oldDocument, context);
    }
  
    if (isLWorAF) {
      await sendLWAFPostCurationEmails(updatedDocument, oldDocument);
    }
  
    await sendPostSharedWithUserNotifications(updatedDocument, oldDocument);
    await sendAlignmentSubmissionApprovalNotifications(updatedDocument, oldDocument);
    await updatePostShortform(updatedDocument, oldDocument, context);
    await updateCommentHideKarma(updatedDocument, oldDocument, context);
    await extractSocialPreviewImage(updatedDocument, updateCallbackProperties);
    await oldPostsLastCommentedAt(updatedDocument, context);  

    // runEditAsyncEditableCallbacks
    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    // elasticSync
    if (isElasticEnabled) {
      void elasticSyncDocument('Posts', updatedDocument._id);
    }

    // logFieldChanges
    void logFieldChanges({ currentUser, collection: Posts, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(context.currentUser, 'Posts', updatedDocument, context);
    return filteredReturnValue;
  },
});
