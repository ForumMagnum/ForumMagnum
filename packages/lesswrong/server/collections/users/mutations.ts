
import schema from "@/lib/collections/users/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { approveUnreviewedSubmissions, changeDisplayNameRateLimit, clearKarmaChangeBatchOnSettingsChange, createRecombeeUser, handleSetShortformPost, makeFirstUserAdminAndApproved, maybeSendVerificationEmail, newAlignmentUserMoveShortform, newAlignmentUserSendPMAsync, newSubforumMemberNotifyMods, reindexDeletedUserContent, sendWelcomingPM, subscribeOnSignup, subscribeToEAForumAudience, syncProfileUpdatedAt, updateDigestSubscription, updateDisplayName, updateUserMayTriggerReview, updatingPostAudio, userEditBannedCallbacksAsync, userEditChangeDisplayNameCallbacksAsync, userEditDeleteContentCallbacksAsync, usersEditCheckEmail } from "@/server/callbacks/userCallbackFunctions";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck() {
  return true;
}

function editCheck(user: DbUser | null, document: DbUser) {
  if (!user || !document)
    return false;

  if (userCanDo(user, 'alignment.sidebar'))
    return true

  // OpenCRUD backwards compatibility
  return userOwns(user, document)
    ? userCanDo(user, ['user.update.own', 'users.edit.own'])
    : userCanDo(user, ['user.update.all', 'users.edit.all']);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Users', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Users', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    data = await makeFirstUserAdminAndApproved(data, context);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Users', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Users',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    createRecombeeUser(asyncProperties);

    if (isElasticEnabled) {
      void elasticSyncDocument('Users', documentWithId._id);
    }

    await subscribeOnSignup(documentWithId);
    await subscribeToEAForumAudience(documentWithId);
    await sendWelcomingPM(documentWithId);

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Users', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, Users } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: userSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Users', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    await changeDisplayNameRateLimit(updateCallbackProperties);

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    await updateDigestSubscription(data, updateCallbackProperties);
    await updateDisplayName(data, updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    maybeSendVerificationEmail(modifier, oldDocument);
    modifier = clearKarmaChangeBatchOnSettingsChange(modifier, oldDocument);
    modifier = await usersEditCheckEmail(modifier, oldDocument);
    modifier = syncProfileUpdatedAt(modifier, oldDocument);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Users, userSelector, context) ?? previewDocument as DbUser;

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Users',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    updateUserMayTriggerReview(updateCallbackProperties);
    await userEditDeleteContentCallbacksAsync(updateCallbackProperties);

    await newSubforumMemberNotifyMods(updatedDocument, oldDocument, context);
    await approveUnreviewedSubmissions(updatedDocument, oldDocument, context);
    await handleSetShortformPost(updatedDocument, oldDocument, context);
    await updatingPostAudio(updatedDocument, oldDocument);
    await userEditChangeDisplayNameCallbacksAsync(updatedDocument, oldDocument, context);
    userEditBannedCallbacksAsync(updatedDocument, oldDocument);
    await newAlignmentUserSendPMAsync(updatedDocument, oldDocument, context);
    await newAlignmentUserMoveShortform(updatedDocument, oldDocument, context);

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    if (isElasticEnabled) {
      void elasticSyncDocument('Users', updatedDocument._id);
    }

    await reindexDeletedUserContent(updatedDocument, oldDocument, context);

    void logFieldChanges({ currentUser, collection: Users, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Users', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createUser, updateFunction as updateUser };


export const graphqlUserTypeDefs = gql`
  input CreateUserInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateUserInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(input: UpdateUserInput!): User
  }
`;
