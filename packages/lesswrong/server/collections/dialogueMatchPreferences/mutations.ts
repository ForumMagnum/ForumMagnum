
import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
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

const { createFunction, updateFunction } = getDefaultMutationFunctions('DialogueMatchPreferences', {
  createFunction: async ({ data }: CreateDialogueMatchPreferenceInput, context) => {
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

    await runCountOfReferenceCallbacks({
      collectionName: 'DialogueMatchPreferences',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateDialogueMatchPreferenceInput, context) => {
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

    await runCountOfReferenceCallbacks({
      collectionName: 'DialogueMatchPreferences',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: DialogueMatchPreferences, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createDialogueMatchPreferenceGqlMutation = makeGqlCreateMutation('DialogueMatchPreferences', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'DialogueMatchPreferences', rawResult, context)
});

export const updateDialogueMatchPreferenceGqlMutation = makeGqlUpdateMutation('DialogueMatchPreferences', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'DialogueMatchPreferences', rawResult, context)
});


export { createFunction as createDialogueMatchPreference, updateFunction as updateDialogueMatchPreference };


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
