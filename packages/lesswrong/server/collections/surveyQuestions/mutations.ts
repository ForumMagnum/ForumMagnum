
import schema from "@/lib/collections/surveyQuestions/newSchema";
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


function newCheck(user: DbUser | null, document: CreateSurveyQuestionDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurveyQuestion | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('SurveyQuestions', {
  createFunction: async ({ data }: CreateSurveyQuestionInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('SurveyQuestions', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SurveyQuestions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveyQuestions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSurveyQuestionInput, context, skipValidation?: boolean) => {
    const { currentUser, SurveyQuestions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: surveyquestionSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('SurveyQuestions', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, SurveyQuestions, surveyquestionSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveyQuestions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: SurveyQuestions, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyQuestions', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('SurveyQuestions', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyQuestions', rawResult, context)
});


export { createFunction as createSurveyQuestion, updateFunction as updateSurveyQuestion };
export { wrappedCreateFunction as createSurveyQuestionMutation, wrappedUpdateFunction as updateSurveyQuestionMutation };


export const graphqlSurveyQuestionTypeDefs = gql`
  input CreateSurveyQuestionDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSurveyQuestionInput {
    data: CreateSurveyQuestionDataInput!
  }
  
  input UpdateSurveyQuestionDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSurveyQuestionInput {
    selector: SelectorInput!
    data: UpdateSurveyQuestionDataInput!
  }
  
  type SurveyQuestionOutput {
    data: SurveyQuestion
  }

  extend type Mutation {
    createSurveyQuestion(data: CreateSurveyQuestionDataInput!): SurveyQuestionOutput
    updateSurveyQuestion(selector: SelectorInput!, data: UpdateSurveyQuestionDataInput!): SurveyQuestionOutput
  }
`;
