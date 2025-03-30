
import schema from "@/lib/collections/reviewVotes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { ensureUniqueVotes, positiveReviewVoteNotifications } from "@/server/callbacks/reviewVoteCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import clone from "lodash/clone";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbReviewVote>> | null, context: ResolverContext) {
  return !user?.deleted && !user?.voteBanned;
}

function editCheck(user: DbUser | null, document: DbReviewVote | null, context: ResolverContext) {
  if (!user || !document) return false;
  return !user.deleted && !user.voteBanned;
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ReviewVotes', {
  createFunction: async (data, context) => {
    const { currentUser, ReviewVotes } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ReviewVotes', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    await ensureUniqueVotes(callbackProps);

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ReviewVotes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ReviewVotes',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    await positiveReviewVoteNotifications(documentWithId, currentUser, ReviewVotes, afterCreateProperties);

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ReviewVotes', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }, context) => {
    const { currentUser, ReviewVotes } = context;

    const {
      documentSelector: reviewvoteSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ReviewVotes', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ReviewVotes, reviewvoteSelector, context) ?? previewDocument as DbReviewVote;

    await runCountOfReferenceCallbacks({
      collectionName: 'ReviewVotes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ReviewVotes', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createReviewVote, updateFunction as updateReviewVote };

// This doesn't have CRUD mutations, the functions are used purely by `submitReviewVote`.
