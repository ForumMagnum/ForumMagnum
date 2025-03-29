
import schema from "@/lib/collections/electionVotes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('ElectionVotes', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ElectionVotes', {
      context,
      data,
      newCheck,
      schema,
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

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ElectionVotes', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, ElectionVotes } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: electionvoteSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ElectionVotes', { selector, context, data, editCheck, schema });

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

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ElectionVotes', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createElectionVote, updateFunction as updateElectionVote };


export const graphqlElectionVoteTypeDefs = gql`
  input CreateElectionVoteInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateElectionVoteInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createElectionVote(input: CreateElectionVoteInput!): ElectionVote
    updateElectionVote(input: UpdateElectionVoteInput!): ElectionVote
  }
`;
