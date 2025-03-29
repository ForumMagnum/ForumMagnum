
import schema from "@/lib/collections/moderatorActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbModeratorAction>> | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbModeratorAction | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ModeratorActions', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ModeratorActions', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModeratorActions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ModeratorActions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    // ****************************************************
    // TODO: add missing createAsync callbacks here!!!
    // ****************************************************

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ModeratorActions', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, ModeratorActions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: moderatoractionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ModeratorActions', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ModeratorActions, moderatoractionSelector, context) ?? previewDocument as DbModeratorAction;

    await runCountOfReferenceCallbacks({
      collectionName: 'ModeratorActions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ModeratorActions, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ModeratorActions', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createModeratorAction, updateFunction as updateModeratorAction };


export const graphqlModeratorActionTypeDefs = gql`
  input CreateModeratorActionInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateModeratorActionInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createModeratorAction(input: CreateModeratorActionInput!): ModeratorAction
    updateModeratorAction(input: UpdateModeratorActionInput!): ModeratorAction
  }
`;
