
import schema from "@/lib/collections/surveyResponses/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";


function newCheck(user: DbUser | null, document: CreateSurveyResponseDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurveyResponse | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('SurveyResponses', {
  createFunction: async ({ data }: CreateSurveyResponseInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('SurveyResponses', {
      context,
      data,
      schema,
      skipValidation,
    });

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

  updateFunction: async ({ selector, data }: UpdateSurveyResponseInput, context, skipValidation?: boolean) => {
    const { currentUser, SurveyResponses } = context;

    const {
      documentSelector: surveyresponseSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('SurveyResponses', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, SurveyResponses, surveyresponseSelector, context) ?? previewDocument as DbSurveyResponse;

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveyResponses',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyResponses', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('SurveyResponses', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyResponses', rawResult, context)
});


export { createFunction as createSurveyResponse, updateFunction as updateSurveyResponse };
export { wrappedCreateFunction as createSurveyResponseMutation, wrappedUpdateFunction as updateSurveyResponseMutation };


export const graphqlSurveyResponseTypeDefs = gql`
  input CreateSurveyResponseDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateSurveyResponseInput {
    data: CreateSurveyResponseDataInput!
  }
  
  input UpdateSurveyResponseDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateSurveyResponseInput {
    selector: SelectorInput!
    data: UpdateSurveyResponseDataInput!
  }
  
  extend type Mutation {
    createSurveyResponse(input: CreateSurveyResponseInput!): SurveyResponse
    updateSurveyResponse(selector: SelectorInput!, data: UpdateSurveyResponseDataInput!): SurveyResponse
  }
`;
