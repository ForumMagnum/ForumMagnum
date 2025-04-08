
import schema from "@/lib/collections/votes/newSchema";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbVote>> | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbVote | null, context: ResolverContext) {
  if (!user || !document) return false;
  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Votes', {
  createFunction: async ({ data }: { data: Partial<DbInsertion<DbVote>> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Votes', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Votes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Votes',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbInsertion<DbVote>> }, context) => {
    const { currentUser, Votes } = context;

    const {
      documentSelector: voteSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Votes', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, Votes, voteSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'Votes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});


export { createFunction as createVote, updateFunction as updateVote };
