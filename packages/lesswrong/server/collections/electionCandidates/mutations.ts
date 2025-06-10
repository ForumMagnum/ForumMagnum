
import schema from "@/lib/collections/electionCandidates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { setDefaultVotingFields } from "@/server/callbacks/electionCandidateCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateElectionCandidateDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbElectionCandidate | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createElectionCandidate({ data }: CreateElectionCandidateInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ElectionCandidates', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = setDefaultVotingFields(data);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ElectionCandidates', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ElectionCandidates', documentWithId);

  return documentWithId;
}

export async function updateElectionCandidate({ selector, data }: UpdateElectionCandidateInput, context: ResolverContext) {
  const { currentUser, ElectionCandidates } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: electioncandidateSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ElectionCandidates', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, ElectionCandidates, electioncandidateSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ElectionCandidates', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: ElectionCandidates, oldDocument, data: origData });

  return updatedDocument;
}

export const createElectionCandidateGqlMutation = makeGqlCreateMutation('ElectionCandidates', createElectionCandidate, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionCandidates', rawResult, context)
});

export const updateElectionCandidateGqlMutation = makeGqlUpdateMutation('ElectionCandidates', updateElectionCandidate, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionCandidates', rawResult, context)
});




export const graphqlElectionCandidateTypeDefs = gql`
  input CreateElectionCandidateDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateElectionCandidateInput {
    data: CreateElectionCandidateDataInput!
  }
  
  input UpdateElectionCandidateDataInput ${
    getUpdatableGraphQLFields(schema)
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
