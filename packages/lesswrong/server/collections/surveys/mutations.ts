
import schema from "@/lib/collections/surveys/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateSurveyDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurvey | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Surveys', {
  createFunction: async ({ data }: CreateSurveyInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Surveys', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Surveys', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Surveys',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSurveyInput, context, skipValidation?: boolean) => {
    const { currentUser, Surveys } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: surveySelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Surveys', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, Surveys, surveySelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'Surveys',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Surveys, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createSurveyGqlMutation = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Surveys', rawResult, context)
});

export const updateSurveyGqlMutation = makeGqlUpdateMutation('Surveys', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Surveys', rawResult, context)
});


export { createFunction as createSurvey, updateFunction as updateSurvey };


export const graphqlSurveyTypeDefs = gql`
  input CreateSurveyDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSurveyInput {
    data: CreateSurveyDataInput!
  }
  
  input UpdateSurveyDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSurveyInput {
    selector: SelectorInput!
    data: UpdateSurveyDataInput!
  }
  
  type SurveyOutput {
    data: Survey
  }

  extend type Mutation {
    createSurvey(data: CreateSurveyDataInput!): SurveyOutput
    updateSurvey(selector: SelectorInput!, data: UpdateSurveyDataInput!): SurveyOutput
  }
`;
