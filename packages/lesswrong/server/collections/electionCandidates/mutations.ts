
import schema from "@/lib/collections/electionCandidates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { setDefaultVotingFields } from "@/server/callbacks/electionCandidateCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { UpdateSelector, convertDocumentIdToIdInSelector } from "@/lib/vulcan-lib/utils";
import { throwError } from "@/server/vulcan-lib/errors";
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

export async function deleteElectionCandidate({ selector }: DeleteElectionCandidateInput, context: ResolverContext) {
  const { currentUser, ElectionCandidates } = context;

  const documentSelector = convertDocumentIdToIdInSelector(selector as UpdateSelector);
  const document = await ElectionCandidates.findOne(documentSelector);

  if (!document) {
    throwError({ id: 'app.document_not_found', data: { documentId: documentSelector._id } });
  }

  if (!(await editCheck(currentUser, document, context))) {
    throwError({ id: 'app.operation_not_allowed', data: { documentId: documentSelector._id } });
  }

  await ElectionCandidates.rawRemove(selector);

  return document;
}

export const createElectionCandidateGqlMutation = makeGqlCreateMutation('ElectionCandidates', createElectionCandidate, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionCandidates', rawResult, context)
});

export const updateElectionCandidateGqlMutation = makeGqlUpdateMutation('ElectionCandidates', updateElectionCandidate, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElectionCandidates', rawResult, context)
});

export const deleteElectionCandidateGqlMutation = async (root: void, args: { selector: { _id?: string, documentId?: string } }, context: ResolverContext) => {
  const result = await deleteElectionCandidate(args, context);
  const filteredResult = await accessFilterSingle(context.currentUser, 'ElectionCandidates', result, context);
  return { data: filteredResult };
};




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
  
  input ElectionCandidateSelectorUniqueInput {
    _id: String
    documentId: String
  }
  
  input DeleteElectionCandidateInput {
    selector: ElectionCandidateSelectorUniqueInput!
  }
  
  type ElectionCandidateOutput {
    data: ElectionCandidate
  }

  extend type Mutation {
    createElectionCandidate(data: CreateElectionCandidateDataInput!): ElectionCandidateOutput
    updateElectionCandidate(selector: SelectorInput!, data: UpdateElectionCandidateDataInput!): ElectionCandidateOutput
    deleteElectionCandidate(selector: ElectionCandidateSelectorUniqueInput!): ElectionCandidateOutput
  }
`;
