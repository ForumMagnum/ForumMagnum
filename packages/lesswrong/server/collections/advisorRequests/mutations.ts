
import schema from "@/lib/collections/advisorRequests/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateAdvisorRequestDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'advisorrequest.create',
    'advisorrequests.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbAdvisorRequest | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'advisorrequest.update.own',
      'advisorrequests.edit.own',
    ])
    : userCanDo(user, [
      'advisorrequest.update.all',
      'advisorrequests.edit.all',
    ]);
}


export async function createAdvisorRequest({ data }: CreateAdvisorRequestInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('AdvisorRequests', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'AdvisorRequests', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('AdvisorRequests', documentWithId);

  return documentWithId;
}

export async function updateAdvisorRequest({ selector, data }: UpdateAdvisorRequestInput, context: ResolverContext) {
  const { currentUser, AdvisorRequests } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: advisorrequestSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('AdvisorRequests', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, AdvisorRequests, advisorrequestSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('AdvisorRequests', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: AdvisorRequests, oldDocument, data: origData });

  return updatedDocument;
}

export const createAdvisorRequestGqlMutation = makeGqlCreateMutation('AdvisorRequests', createAdvisorRequest, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'AdvisorRequests', rawResult, context)
});

export const updateAdvisorRequestGqlMutation = makeGqlUpdateMutation('AdvisorRequests', updateAdvisorRequest, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'AdvisorRequests', rawResult, context)
});



export const graphqlAdvisorRequestTypeDefs = gql`
  input CreateAdvisorRequestDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateAdvisorRequestInput {
    data: CreateAdvisorRequestDataInput!
  }
  
  input UpdateAdvisorRequestDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateAdvisorRequestInput {
    selector: SelectorInput!
    data: UpdateAdvisorRequestDataInput!
  }
  
  type AdvisorRequestOutput {
    data: AdvisorRequest
  }

  extend type Mutation {
    createAdvisorRequest(data: CreateAdvisorRequestDataInput!): AdvisorRequestOutput
    updateAdvisorRequest(selector: SelectorInput!, data: UpdateAdvisorRequestDataInput!): AdvisorRequestOutput
  }
`;
