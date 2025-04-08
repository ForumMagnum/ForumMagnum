
import schema from "@/lib/collections/reviewWinners/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbReviewWinner>> | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbReviewWinner | null, context: ResolverContext) {
  if (!user || !document) return false;
  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ReviewWinners', {
  createFunction: async ({ data }: { data: Partial<DbInsertion<DbReviewWinner>> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('ReviewWinners', {
      context,
      data,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ReviewWinners', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('ReviewWinners', documentWithId);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbInsertion<DbReviewWinner>> }, context) => {
    const { currentUser, ReviewWinners } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: reviewwinnerSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('ReviewWinners', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, ReviewWinners, reviewwinnerSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ReviewWinners', updatedDocument, oldDocument);

    void logFieldChanges({ currentUser, collection: ReviewWinners, oldDocument, data: origData });

    return updatedDocument;
  },
});


export { createFunction as createReviewWinner, updateFunction as updateReviewWinner };
