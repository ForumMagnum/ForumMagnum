
import schema from "@/lib/collections/revisions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { recomputeWhenSkipAttributionChanged } from "@/server/callbacks/revisionCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkUpdatePermissionsAndReturnProps, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

// This has mutators because of a few mutable metadata fields (eg
// skipAttributions), but most parts of revisions are create-only immutable.
const { updateFunction } = getDefaultMutationFunctions('Revisions', {
  updateFunction: async ({ selector, data }: UpdateRevisionInput, context) => {
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

    await recomputeWhenSkipAttributionChanged(updateCallbackProperties);

    void logFieldChanges({ currentUser, collection: Revisions, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Revisions', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { updateFunction as updateRevision };


export const graphqlRevisionTypeDefs = gql`
  input UpdateRevisionDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateRevisionInput {
    selector: SelectorInput!
    data: UpdateRevisionDataInput!
  }
  
  extend type Mutation {
    updateRevision(input: UpdateRevisionInput!): Revision
  }
`;
