
import schema from "@/lib/collections/surveyQuestions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateSurveyQuestionDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurveyQuestion | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createSurveyQuestion({ data }: CreateSurveyQuestionInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('SurveyQuestions', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SurveyQuestions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('SurveyQuestions', documentWithId);

  return documentWithId;
}

export async function updateSurveyQuestion({ selector, data }: UpdateSurveyQuestionInput, context: ResolverContext) {
  const { currentUser, SurveyQuestions } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: surveyquestionSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('SurveyQuestions', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, SurveyQuestions, surveyquestionSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('SurveyQuestions', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: SurveyQuestions, oldDocument, data: origData });

  return updatedDocument;
}

export const createSurveyQuestionGqlMutation = makeGqlCreateMutation('SurveyQuestions', createSurveyQuestion, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyQuestions', rawResult, context)
});

export const updateSurveyQuestionGqlMutation = makeGqlUpdateMutation('SurveyQuestions', updateSurveyQuestion, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveyQuestions', rawResult, context)
});




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
