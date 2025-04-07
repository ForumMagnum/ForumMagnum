
import schema from "@/lib/collections/electionCandidates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { setDefaultVotingFields } from "@/server/callbacks/electionCandidateCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateElectionCandidateDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbElectionCandidate | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ElectionCandidates', {
  createFunction: async ({ data }: CreateElectionCandidateInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ElectionCandidates', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = setDefaultVotingFields(data);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ElectionCandidates', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ElectionCandidates',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateElectionCandidateInput, context, skipValidation?: boolean) => {
    const { currentUser, ElectionCandidates } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: electioncandidateSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ElectionCandidates', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, ElectionCandidates, electioncandidateSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'ElectionCandidates',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ElectionCandidates, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionCandidates', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('ElectionCandidates', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionCandidates', rawResult, context)
});


export { createFunction as createElectionCandidate, updateFunction as updateElectionCandidate };
export { wrappedCreateFunction as createElectionCandidateMutation, wrappedUpdateFunction as updateElectionCandidateMutation };


export const graphqlElectionCandidateTypeDefs = gql`
  input CreateElectionCandidateDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateElectionCandidateInput {
    data: CreateElectionCandidateDataInput!
  }
  
  input UpdateElectionCandidateDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateElectionCandidateInput {
    selector: SelectorInput!
    data: UpdateElectionCandidateDataInput!
  }
  
  type ElectionCandidateOutput {
    data: ElectionCandidate
  }

  extend type Mutation {
    createElectionCandidate(data: CreateElectionCandidateDataInput!): ElectionCandidateOutput
    updateElectionCandidate(selector: SelectorInput!, data: UpdateElectionCandidateDataInput!): ElectionCandidateOutput
  }
`;
