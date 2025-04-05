
import { isPastVotingDeadline, userCanVoteInDonationElection } from "@/lib/collections/electionVotes/helpers";
import schema from "@/lib/collections/electionVotes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { isAdmin, userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (!userCanVoteInDonationElection(user)) {
    throw new Error("Accounts created after 22nd Oct 2023 cannot vote in this election");
  }
  if (isPastVotingDeadline()) {
    throw new Error("Voting has closed");
  }

  return true;
}

function editCheck(user: DbUser | null, document: DbElectionVote | null) {
  if (!user || !document) return false;
  if (userIsAdmin(user)) return true;

  if (!userCanVoteInDonationElection(user)) {
    throw new Error("Accounts created after 22nd Oct 2023 cannot vote in this election");
  }
  if (isPastVotingDeadline()) {
    throw new Error("Voting has closed, you can no longer edit your vote");
  }
  if (userOwns(user, document)) return true;

  return false;
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('ElectionVotes', {
  createFunction: async ({ data }: CreateElectionVoteInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ElectionVotes', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ElectionVotes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ElectionVotes',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateElectionVoteInput, context, skipValidation?: boolean) => {
    const { currentUser, ElectionVotes } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: electionvoteSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ElectionVotes', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ElectionVotes, electionvoteSelector, context) ?? previewDocument as DbElectionVote;

    await runCountOfReferenceCallbacks({
      collectionName: 'ElectionVotes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ElectionVotes, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionVotes', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('ElectionVotes', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionVotes', rawResult, context)
});


export { createFunction as createElectionVote, updateFunction as updateElectionVote };
export { wrappedCreateFunction as createElectionVoteMutation, wrappedUpdateFunction as updateElectionVoteMutation };


export const graphqlElectionVoteTypeDefs = gql`
  input CreateElectionVoteDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateElectionVoteInput {
    data: CreateElectionVoteDataInput!
  }
  
  input UpdateElectionVoteDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateElectionVoteInput {
    selector: SelectorInput!
    data: UpdateElectionVoteDataInput!
  }
  
  type ElectionVoteOutput {
    data: ElectionVote
  }

  extend type Mutation {
    createElectionVote(data: CreateElectionVoteDataInput!): ElectionVoteOutput
    updateElectionVote(selector: SelectorInput!, data: UpdateElectionVoteDataInput!): ElectionVoteOutput
  }
`;
