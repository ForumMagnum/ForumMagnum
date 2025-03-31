
import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
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

    const callbackProps = await checkCreatePermissionsAndReturnProps('DialogueMatchPreferences', {
      context,
      data,
      newCheck,
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

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'DialogueMatchPreferences', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdateDialogueMatchPreferenceInput, context) => {
    const { currentUser, DialogueMatchPreferences } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: dialoguematchpreferenceSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('DialogueMatchPreferences', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, DialogueMatchPreferences, dialoguematchpreferenceSelector, context) ?? previewDocument as DbDialogueMatchPreference;

    await runCountOfReferenceCallbacks({
      collectionName: 'DialogueMatchPreferences',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: DialogueMatchPreferences, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'DialogueMatchPreferences', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createDialogueMatchPreference, updateFunction as updateDialogueMatchPreference };


export const graphqlDialogueMatchPreferenceTypeDefs = gql`
  input CreateDialogueMatchPreferenceDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateDialogueMatchPreferenceInput {
    data: CreateDialogueMatchPreferenceDataInput!
  }
  
  input UpdateDialogueMatchPreferenceDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateDialogueMatchPreferenceInput {
    selector: SelectorInput!
    data: UpdateDialogueMatchPreferenceDataInput!
  }
  
  extend type Mutation {
    createDialogueMatchPreference(input: CreateDialogueMatchPreferenceInput!): DialogueMatchPreference
    updateDialogueMatchPreference(input: UpdateDialogueMatchPreferenceInput!): DialogueMatchPreference
  }
`;
