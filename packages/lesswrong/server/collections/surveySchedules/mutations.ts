
import schema from "@/lib/collections/surveySchedules/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
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


const { createFunction, updateFunction } = getDefaultMutationFunctions('SurveySchedules', {
  createFunction: async ({ data }: CreateSurveyScheduleInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('SurveySchedules', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SurveySchedules', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveySchedules',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSurveyScheduleInput, context) => {
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

    await runCountOfReferenceCallbacks({
      collectionName: 'SurveySchedules',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: SurveySchedules, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createSurveyScheduleGqlMutation = makeGqlCreateMutation('SurveySchedules', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveySchedules', rawResult, context)
});

export const updateSurveyScheduleGqlMutation = makeGqlUpdateMutation('SurveySchedules', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveySchedules', rawResult, context)
});


export { createFunction as createSurveySchedule, updateFunction as updateSurveySchedule };


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
