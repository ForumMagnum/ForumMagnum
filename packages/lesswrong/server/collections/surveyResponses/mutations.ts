
import schema from "@/lib/collections/surveyResponses/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


function newCheck(user: DbUser | null, document: CreateSurveyResponseDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurveyResponse | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('SurveyResponses', {
  createFunction: async ({ data }: CreateSurveyResponseInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('SurveyResponses', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SurveyResponses', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveyResponses',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSurveyResponseInput, context) => {
    const { currentUser, SurveyResponses } = context;

    const {
      documentSelector: surveyresponseSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('SurveyResponses', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, SurveyResponses, surveyresponseSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveyResponses',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createSurveyResponseGqlMutation = makeGqlCreateMutation('SurveyResponses', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyResponses', rawResult, context)
});

export const updateSurveyResponseGqlMutation = makeGqlUpdateMutation('SurveyResponses', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyResponses', rawResult, context)
});


export { createFunction as createSurveyResponse, updateFunction as updateSurveyResponse };


export const graphqlSurveyResponseTypeDefs = gql`
  input CreateSurveyResponseDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSurveyResponseInput {
    data: CreateSurveyResponseDataInput!
  }
  
  input UpdateSurveyResponseDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSurveyResponseInput {
    selector: SelectorInput!
    data: UpdateSurveyResponseDataInput!
  }
  
  type SurveyResponseOutput {
    data: SurveyResponse
  }

  extend type Mutation {
    createSurveyResponse(data: CreateSurveyResponseDataInput!): SurveyResponseOutput
    updateSurveyResponse(selector: SelectorInput!, data: UpdateSurveyResponseDataInput!): SurveyResponseOutput
  }
`;
