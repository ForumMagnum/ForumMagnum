
import schema from "@/lib/collections/revisions/newSchema";
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


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbRevision>> | null, context: ResolverContext) {
  return userIsAdmin(user);
}

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('Revisions', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Revisions', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Revisions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Revisions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Revisions', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, Revisions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: revisionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Revisions', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Revisions, revisionSelector, context) ?? previewDocument as DbRevision;

    await runCountOfReferenceCallbacks({
      collectionName: 'Revisions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // ****************************************************
    // TODO: add missing updateAsync callbacks here!!!
    // ****************************************************

    void logFieldChanges({ currentUser, collection: Revisions, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Revisions', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createRevision, updateFunction as updateRevision };


export const graphqlRevisionTypeDefs = gql`
  input CreateRevisionInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateRevisionInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createRevision(input: CreateRevisionInput!): Revision
    updateRevision(input: UpdateRevisionInput!): Revision
  }
`;
