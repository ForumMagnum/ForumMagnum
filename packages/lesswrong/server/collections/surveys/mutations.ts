
import schema from "@/lib/collections/surveys/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateSurveyDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurvey | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createSurvey({ data }: CreateSurveyInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Surveys', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Surveys', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Surveys', documentWithId);

  return documentWithId;
}

export async function updateSurvey({ selector, data }: UpdateSurveyInput, context: ResolverContext) {
  const { currentUser, Surveys } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: surveySelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Surveys', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Surveys, surveySelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Surveys', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: Surveys, oldDocument, data: origData });

  return updatedDocument;
}

export const createSurveyGqlMutation = makeGqlCreateMutation('Surveys', createSurvey, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Surveys', rawResult, context)
});

export const updateSurveyGqlMutation = makeGqlUpdateMutation('Surveys', updateSurvey, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Surveys', rawResult, context)
});




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
