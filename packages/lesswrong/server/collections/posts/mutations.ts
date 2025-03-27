import { userCanPost } from "@/lib/collections/users/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { addLinkSharingKey, addReferrerToPost, applyNewPostTags, assertPostTitleHasNoEmojis, autoTagNewPost, checkRecentRepost, checkTosAccepted, createNewJargonTermsCallback, debateMustHaveCoauthor, extractSocialPreviewImage, fixEventStartAndEndTimes, lwPostsNewUpvoteOwnPost, notifyUsersAddedAsPostCoauthors, onPostPublished, postsNewDefaultLocation, postsNewDefaultTypes, postsNewPostRelation, postsNewRateLimit, postsNewUserApprovedStatus, scheduleCoauthoredPostWithUnconfirmedCoauthors, sendCoauthorRequestNotifications, sendUsersSharedOnPostNotifications, triggerReviewForNewPostIfNeeded, updateFirstDebateCommentPostId, updatePostEmbeddingsOnChange } from "@/server/callbacks/postCallbackFunctions";
import { AfterCreateCallbackProperties } from "@/server/mutationCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { throwError } from "@/server/vulcan-lib/errors";
import { runFieldOnCreateCallbacks, updateMutator } from "@/server/vulcan-lib/mutators";
import { performCheck } from "@/server/vulcan-lib/utils";
import { validateDocument } from "@/server/vulcan-lib/validation";
import schema from "@/lib/collections/posts/newSchema";
import { runSlugCreateBeforeCallback } from "@/server/utils/slugUtil";
import { isEAForum, isElasticEnabled } from "@/lib/instanceSettings";
import { performCrosspost } from "@/server/fmCrosspost/crosspost";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runNewAsyncEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { swrInvalidatePostRoute } from "@/server/cache/swr";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from "@/server/embeddings";
import { rehostPostMetaImages } from "@/server/scripts/convertImagesToCloudinary";
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from "@/lib/collections/posts/helpers";
import { userCanDo, userIsMemberOf, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import isEmpty from "lodash/isEmpty";
import { convertDocumentIdToIdInSelector } from "@/lib/vulcan-lib/utils";
import cloneDeep from "lodash/cloneDeep";

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
    if (currentUser && schema.userId && !data.userId) {
      data.userId = currentUser._id;
    }

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
    const insertedId = await Posts.rawInsert(data);

    // afterCreate properties
    let documentWithId = {_id: insertedId, ...data} as DbPost;
    const afterCreateProperties: AfterCreateCallbackProperties<'Posts'> = {
      ...callbackProps,
      document: documentWithId,
      newDocument: documentWithId,
    };

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

    // fetch document from db
    const insertedPost = await Posts.findOne(insertedId);
    // Something went horribly wrong if we don't have the post we just inserted
    if (insertedPost) {
      documentWithId = insertedPost;
    }

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
      void elasticSyncDocument('Posts', insertedId);
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
    const { currentUser, Posts } = context;
    const operationName = 'post.update';

    if (isEmpty(selector)) {
      throw new Error('Selector cannot be empty');
    }

    // get entire unmodified document from database
    const document = await Posts.findOne(convertDocumentIdToIdInSelector(selector));

    if (!document) {
      throw new Error(
        `Could not find document to update for selector: ${JSON.stringify(selector)}`
      );
    }

    await performCheck(
      editCheck,
      currentUser,
      document,
      context,
      '',
      operationName,
      'Posts'
    );

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const returnValue = await updateMutator({
      collection: Posts,
      selector,
      data,
      currentUser,
      validate: true,
      context,
      document,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(context.currentUser, 'Posts', returnValue.data, context);
    return filteredReturnValue;
  },
});
