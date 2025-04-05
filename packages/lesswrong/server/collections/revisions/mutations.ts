
import schema from "@/lib/collections/revisions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { recomputeWhenSkipAttributionChanged, updateDenormalizedHtmlAttributionsDueToRev, upvoteOwnTagRevision } from "@/server/callbacks/revisionCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

// This has mutators because of a few mutable metadata fields (eg
// skipAttributions), but most parts of revisions are create-only immutable.
const { createFunction, updateFunction } = getDefaultMutationFunctions('Revisions', {
  createFunction: async ({ data }: { data: Partial<DbInsertion<DbRevision>> }, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Revisions', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Revisions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await upvoteOwnTagRevision({
      revision: documentWithId,
      context
    });

    await updateDenormalizedHtmlAttributionsDueToRev({
      revision: documentWithId,
      skipDenormalizedAttributions: documentWithId.skipAttributions,
      context
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Revisions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },
  updateFunction: async ({ selector, data }: UpdateRevisionInput, context, skipValidation?: boolean) => {
    const { currentUser, Revisions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: revisionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Revisions', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Revisions', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Revisions', rawResult, context)
});

export { createFunction as createRevision, updateFunction as updateRevision };
export { wrappedUpdateFunction as updateRevisionMutation };


export const graphqlRevisionTypeDefs = gql`
  input UpdateRevisionDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateRevisionInput {
    selector: SelectorInput!
    data: UpdateRevisionDataInput!
  }
  
  extend type Mutation {
    updateRevision(selector: SelectorInput!, data: UpdateRevisionDataInput!): Revision
  }
`;
