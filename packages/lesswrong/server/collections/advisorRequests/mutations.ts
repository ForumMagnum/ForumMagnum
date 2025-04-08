
import schema from "@/lib/collections/advisorRequests/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
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


const { createFunction, updateFunction } = getDefaultMutationFunctions('AdvisorRequests', {
  createFunction: async ({ data }: CreateAdvisorRequestInput, context) => {
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

    await runCountOfReferenceCallbacks({
      collectionName: 'AdvisorRequests',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateAdvisorRequestInput, context) => {
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

    await runCountOfReferenceCallbacks({
      collectionName: 'AdvisorRequests',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: AdvisorRequests, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createAdvisorRequestGqlMutation = makeGqlCreateMutation('AdvisorRequests', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'AdvisorRequests', rawResult, context)
});

export const updateAdvisorRequestGqlMutation = makeGqlUpdateMutation('AdvisorRequests', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'AdvisorRequests', rawResult, context)
});


export { createFunction as createAdvisorRequest, updateFunction as updateAdvisorRequest };

export const graphqlAdvisorRequestTypeDefs = gql`
  input CreateAdvisorRequestDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateAdvisorRequestInput {
    data: CreateAdvisorRequestDataInput!
  }
  
  input UpdateAdvisorRequestDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
