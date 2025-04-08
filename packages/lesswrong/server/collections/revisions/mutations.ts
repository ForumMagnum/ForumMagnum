
import schema from "@/lib/collections/revisions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { recomputeWhenSkipAttributionChanged, updateDenormalizedHtmlAttributionsDueToRev, upvoteOwnTagRevision } from "@/server/callbacks/revisionCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

// This has mutators because of a few mutable metadata fields (eg
// skipAttributions), but most parts of revisions are create-only immutable.
const { createFunction, updateFunction } = getDefaultMutationFunctions('Revisions', {
  createFunction: async ({ data }: { data: Partial<DbInsertion<DbRevision>> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Revisions', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

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

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('Revisions', documentWithId);

    return documentWithId;
  },
  updateFunction: async ({ selector, data }: UpdateRevisionInput, context) => {
    const { currentUser, Revisions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: revisionSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Revisions', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, Revisions, revisionSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Revisions', updatedDocument, oldDocument);

    await recomputeWhenSkipAttributionChanged(updateCallbackProperties);

    void logFieldChanges({ currentUser, collection: Revisions, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const updateRevisionGqlMutation = makeGqlUpdateMutation('Revisions', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Revisions', rawResult, context)
});

export { createFunction as createRevision, updateFunction as updateRevision };


export const graphqlRevisionTypeDefs = gql`
  input UpdateRevisionDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateRevisionInput {
    selector: SelectorInput!
    data: UpdateRevisionDataInput!
  }

  type RevisionOutput {
    data: Revision
  }
  
  extend type Mutation {
    updateRevision(selector: SelectorInput!, data: UpdateRevisionDataInput!): RevisionOutput
  }
`;
