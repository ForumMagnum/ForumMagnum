
import schema from "@/lib/collections/users/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { approveUnreviewedSubmissions, changeDisplayNameRateLimit, clearKarmaChangeBatchOnSettingsChange, createRecombeeUser, handleSetShortformPost, makeFirstUserAdminAndApproved, maybeSendVerificationEmail, newAlignmentUserMoveShortform, newAlignmentUserSendPMAsync, newSubforumMemberNotifyMods, reindexDeletedUserContent, sendWelcomingPM, subscribeOnSignup, subscribeToEAForumAudience, syncProfileUpdatedAt, updateMailchimpSubscription, updateDisplayName, updateUserMayTriggerReview, updatingPostAudio, userEditBannedCallbacksAsync, userEditChangeDisplayNameCallbacksAsync, userEditDeleteContentCallbacksAsync, usersEditCheckEmail } from "@/server/callbacks/userCallbackFunctions";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { dataToModifier, modifierToData } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
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

export async function createUser({ data }: CreateUserInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Users', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await runSlugCreateBeforeCallback(callbackProps);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  data = await makeFirstUserAdminAndApproved(data, context);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Users', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Users', documentWithId);

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

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateUser({ selector, data }: { data: UpdateUserDataInput | Partial<DbUser>, selector: SelectorInput }, context: ResolverContext) {
  const { currentUser, Users } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: userSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Users', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  await changeDisplayNameRateLimit(updateCallbackProperties);

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

  await updateMailchimpSubscription(data, updateCallbackProperties);
  await updateDisplayName(data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let modifier = dataToModifier(data);

  maybeSendVerificationEmail(modifier, oldDocument);
  modifier = clearKarmaChangeBatchOnSettingsChange(modifier, oldDocument);
  modifier = await usersEditCheckEmail(modifier, oldDocument);
  modifier = syncProfileUpdatedAt(modifier, oldDocument);

  data = modifierToData(modifier);
  let updatedDocument = await updateAndReturnDocument(data, Users, userSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Users', updatedDocument, oldDocument);

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

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  if (isElasticEnabled) {
    void elasticSyncDocument('Users', updatedDocument._id);
  }

  await reindexDeletedUserContent(updatedDocument, oldDocument, context);

  void logFieldChanges({ currentUser, collection: Users, oldDocument, data: origData });

  return updatedDocument;
}

export const createUserGqlMutation = makeGqlCreateMutation('Users', createUser, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Users', rawResult, context)
});

export const updateUserGqlMutation = makeGqlUpdateMutation('Users', updateUser, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Users', rawResult, context)
});




export const graphqlUserTypeDefs = gql`
  input CreateUserDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateUserInput {
    data: CreateUserDataInput!
  }
  
  input UpdateUserDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateUserInput {
    selector: SelectorInput!
    data: UpdateUserDataInput!
  }
  
  type UserOutput {
    data: User
  }

  extend type Mutation {
    createUser(data: CreateUserDataInput!): UserOutput
    updateUser(selector: SelectorInput!, data: UpdateUserDataInput!): UserOutput
  }
`;
