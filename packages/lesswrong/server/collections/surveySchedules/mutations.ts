
import schema from "@/lib/collections/surveySchedules/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateSurveyScheduleDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurveySchedule | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createSurveySchedule({ data }: CreateSurveyScheduleInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('SurveySchedules', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SurveySchedules', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('SurveySchedules', documentWithId);

  return documentWithId;
}

export async function updateSurveySchedule({ selector, data }: UpdateSurveyScheduleInput, context: ResolverContext) {
  const { currentUser, SurveySchedules } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: surveyscheduleSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('SurveySchedules', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, SurveySchedules, surveyscheduleSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('SurveySchedules', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: SurveySchedules, oldDocument, data: origData });

  return updatedDocument;
}

export const createSurveyScheduleGqlMutation = makeGqlCreateMutation('SurveySchedules', createSurveySchedule, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveySchedules', rawResult, context)
});

export const updateSurveyScheduleGqlMutation = makeGqlUpdateMutation('SurveySchedules', updateSurveySchedule, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveySchedules', rawResult, context)
});




export const graphqlSurveyScheduleTypeDefs = gql`
  input CreateSurveyScheduleDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSurveyScheduleInput {
    data: CreateSurveyScheduleDataInput!
  }
  
  input UpdateSurveyScheduleDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSurveyScheduleInput {
    selector: SelectorInput!
    data: UpdateSurveyScheduleDataInput!
  }
  
  type SurveyScheduleOutput {
    data: SurveySchedule
  }

  extend type Mutation {
    createSurveySchedule(data: CreateSurveyScheduleDataInput!): SurveyScheduleOutput
    updateSurveySchedule(selector: SelectorInput!, data: UpdateSurveyScheduleDataInput!): SurveyScheduleOutput
  }
`;
