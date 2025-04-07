
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from "@/lib/collections/posts/helpers";
import schema from "@/lib/collections/posts/newSchema";
import { userCanPost } from "@/lib/collections/users/helpers";
import { isEAForum, isElasticEnabled, isLWorAF } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userIsMemberOf, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { swrInvalidatePostRoute } from "@/server/cache/swr";
import { moveToAFUpdatesUserAFKarma } from "@/server/callbacks/alignment-forum/callbacks";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { addLinkSharingKey, addReferrerToPost, applyNewPostTags, assertPostTitleHasNoEmojis, autoTagNewPost, autoTagUndraftedPost, checkRecentRepost, checkTosAccepted, clearCourseEndTime, createNewJargonTermsCallback, eventUpdatedNotifications, extractSocialPreviewImage, fixEventStartAndEndTimes, lwPostsNewUpvoteOwnPost, notifyUsersAddedAsCoauthors, notifyUsersAddedAsPostCoauthors, oldPostsLastCommentedAt, onEditAddLinkSharingKey, onPostPublished, postsNewDefaultLocation, postsNewDefaultTypes, postsNewPostRelation, postsNewRateLimit, postsNewUserApprovedStatus, postsUndraftRateLimit, removeFrontpageDate, removeRedraftNotifications, resetDialogueMatches, resetPostApprovedDate, scheduleCoauthoredPostWhenUndrafted, scheduleCoauthoredPostWithUnconfirmedCoauthors, sendCoauthorRequestNotifications, sendEAFCuratedAuthorsNotification, sendLWAFPostCurationEmails, sendNewPublishedDialogueMessageNotifications, sendPostApprovalNotifications, sendPostSharedWithUserNotifications, sendRejectionPM, sendUsersSharedOnPostNotifications, setPostUndraftedFields, syncTagRelevance, triggerReviewForNewPostIfNeeded, updateCommentHideKarma, updatedPostMaybeTriggerReview, updatePostEmbeddingsOnChange, updatePostShortform, updateRecombeePost, updateUserNotesOnPostDraft, updateUserNotesOnPostRejection } from "@/server/callbacks/postCallbackFunctions";
import { sendAlignmentSubmissionApprovalNotifications } from "@/server/callbacks/sharedCallbackFunctions";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from "@/server/embeddings";
import { logFieldChanges } from "@/server/fieldChanges";
import { handleCrosspostUpdate, performCrosspost } from "@/server/fmCrosspost/crosspost";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { rehostPostMetaImages } from "@/server/scripts/convertImagesToCloudinary";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


async function newCheck(user: DbUser | null, document: CreatePostDataInput | null, context: ResolverContext) {
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
  createFunction: async ({ data }: CreatePostInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Posts', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    // former createValidate callbacks
    if (!skipValidation) {
      await postsNewRateLimit([], callbackProps);
    }

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    // former createBefore
    data = addReferrerToPost(data, callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    // former newSync callbacks
    if (isEAForum) {
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

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Posts', callbackProps);
    let documentWithId = afterCreateProperties.document;

    // former createAfter callbacks
    await swrInvalidatePostRoute(documentWithId._id);
    if (!documentWithId.authorIsUnreviewed && !documentWithId.draft) {
      void onPostPublished(documentWithId, context);
    }
    documentWithId = await applyNewPostTags(documentWithId, afterCreateProperties);
    documentWithId = await createNewJargonTermsCallback(documentWithId, afterCreateProperties);

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Posts',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // former newAfter callbacks
    documentWithId = await sendCoauthorRequestNotifications(documentWithId, afterCreateProperties);
    documentWithId = await lwPostsNewUpvoteOwnPost(documentWithId, afterCreateProperties);
    documentWithId = postsNewPostRelation(documentWithId, afterCreateProperties);
    documentWithId = await extractSocialPreviewImage(documentWithId, afterCreateProperties);

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    // former createAsync callbacks
    await notifyUsersAddedAsPostCoauthors(asyncProperties);
    await triggerReviewForNewPostIfNeeded(asyncProperties);
    await autoTagNewPost(asyncProperties);

    if (isElasticEnabled) {
      void elasticSyncDocument('Posts', documentWithId._id);
    }

    // former newAsync callbacks
    await sendUsersSharedOnPostNotifications(documentWithId);
    if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
      await updatePostEmbeddingsOnChange(documentWithId, undefined);
    }
  
    await rehostPostMetaImages(documentWithId);

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { data: UpdatePostDataInput | Partial<DbPost>; selector: SelectorInput }, context, skipValidation?: boolean) => {
    const { currentUser, Posts } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: postSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Posts', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    // former updateValidate callbacks
    if (!skipValidation) {
      await postsUndraftRateLimit([], updateCallbackProperties);
    }

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    if (isEAForum) {
      data = checkTosAccepted(currentUser, data);
      assertPostTitleHasNoEmojis(data);
    }
  
    // former updateBefore callbacks
    await checkRecentRepost(updateCallbackProperties.newDocument, currentUser, context);
    data = setPostUndraftedFields(data, updateCallbackProperties);
    data = scheduleCoauthoredPostWhenUndrafted(data, updateCallbackProperties);
    // Explicitly don't assign back to partial post here, since it returns the value fetched from the database
    // TODO: that above comment might be wrong, i'm confused about what's supposed to be happening here
    data = await handleCrosspostUpdate(data, updateCallbackProperties);
    data = onEditAddLinkSharingKey(data, updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);
    // former editSync callbacks
    modifier = clearCourseEndTime(modifier, oldDocument);
    modifier = removeFrontpageDate(modifier, oldDocument);
    modifier = resetPostApprovedDate(modifier, oldDocument);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Posts, postSelector, context) ?? previewDocument as DbPost;

    // former updateAfter callbacks
    await swrInvalidatePostRoute(updatedDocument._id);
    updatedDocument = await sendCoauthorRequestNotifications(updatedDocument, updateCallbackProperties);
    updatedDocument = await syncTagRelevance(updatedDocument, updateCallbackProperties);
    updatedDocument = await resetDialogueMatches(updatedDocument, updateCallbackProperties);
    updatedDocument = await createNewJargonTermsCallback(updatedDocument, updateCallbackProperties);

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Posts',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // former updateAsync callbacks
    await eventUpdatedNotifications(updateCallbackProperties);
    await notifyUsersAddedAsCoauthors(updateCallbackProperties);
    await updatePostEmbeddingsOnChange(updateCallbackProperties.newDocument, updateCallbackProperties.oldDocument);
    await updatedPostMaybeTriggerReview(updateCallbackProperties);
    await sendRejectionPM(updateCallbackProperties);
    await updateUserNotesOnPostDraft(updateCallbackProperties);
    await updateUserNotesOnPostRejection(updateCallbackProperties);
    await updateRecombeePost(updateCallbackProperties);
    await autoTagUndraftedPost(updateCallbackProperties);

    // former editAsync callbacks
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

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    if (isElasticEnabled) {
      void elasticSyncDocument('Posts', updatedDocument._id);
    }

    void logFieldChanges({ currentUser, collection: Posts, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Posts', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('Posts', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Posts', rawResult, context)
});


export { createFunction as createPost, updateFunction as updatePost };
export { wrappedCreateFunction as createPostMutation, wrappedUpdateFunction as updatePostMutation };


export const graphqlPostTypeDefs = gql`
  input CreatePostDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreatePostInput {
    data: CreatePostDataInput!
  }
  
  input UpdatePostDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdatePostInput {
    selector: SelectorInput!
    data: UpdatePostDataInput!
  }
  
  type PostOutput {
    data: Post
  }

  extend type Mutation {
    createPost(data: CreatePostDataInput!): PostOutput
    updatePost(selector: SelectorInput!, data: UpdatePostDataInput!): PostOutput
  }
`;
