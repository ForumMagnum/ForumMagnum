
import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

async function newCheck(user: DbUser | null, document: DbDialogueMatchPreference | null, context: ResolverContext) {
  const { DialogueChecks } = context;

  if (!user || !document) return false;
  const dialogueCheck = await DialogueChecks.findOne(document.dialogueCheckId);
  return !!dialogueCheck && userOwns(user, dialogueCheck);
}

async function editCheck(user: DbUser | null, document: DbDialogueMatchPreference|null, context: ResolverContext) {
  const { DialogueChecks } = context;

  if (!user || !document) return false;
  const dialogueCheck = await DialogueChecks.findOne(document.dialogueCheckId);
  if (!dialogueCheck) return false;

  return userOwns(user, dialogueCheck) || userIsAdmin(user);
}

export async function createDialogueMatchPreference({ data }: CreateDialogueMatchPreferenceInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('DialogueMatchPreferences', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'DialogueMatchPreferences', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('DialogueMatchPreferences', documentWithId);

  return documentWithId;
}

export async function updateDialogueMatchPreference({ selector, data }: UpdateDialogueMatchPreferenceInput, context: ResolverContext) {
  const { currentUser, DialogueMatchPreferences } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: dialoguematchpreferenceSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('DialogueMatchPreferences', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, DialogueMatchPreferences, dialoguematchpreferenceSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('DialogueMatchPreferences', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: DialogueMatchPreferences, oldDocument, data: origData });

  return updatedDocument;
}

export const createDialogueMatchPreferenceGqlMutation = makeGqlCreateMutation('DialogueMatchPreferences', createDialogueMatchPreference, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'DialogueMatchPreferences', rawResult, context)
});

export const updateDialogueMatchPreferenceGqlMutation = makeGqlUpdateMutation('DialogueMatchPreferences', updateDialogueMatchPreference, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'DialogueMatchPreferences', rawResult, context)
});




export const graphqlDialogueMatchPreferenceTypeDefs = gql`
  input CreateDialogueMatchPreferenceDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateDialogueMatchPreferenceInput {
    data: CreateDialogueMatchPreferenceDataInput!
  }
  
  input UpdateDialogueMatchPreferenceDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateDialogueMatchPreferenceInput {
    selector: SelectorInput!
    data: UpdateDialogueMatchPreferenceDataInput!
  }
  
  type DialogueMatchPreferenceOutput {
    data: DialogueMatchPreference
  }

  extend type Mutation {
    createDialogueMatchPreference(data: CreateDialogueMatchPreferenceDataInput!): DialogueMatchPreferenceOutput
    updateDialogueMatchPreference(selector: SelectorInput!, data: UpdateDialogueMatchPreferenceDataInput!): DialogueMatchPreferenceOutput
  }
`;
