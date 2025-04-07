
import schema from "@/lib/collections/surveySchedules/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateSurveyScheduleDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSurveySchedule | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('SurveySchedules', {
  createFunction: async ({ data }: CreateSurveyScheduleInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('SurveySchedules', {
      context,
      data,
      schema,
      skipValidation,
    });

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

  updateFunction: async ({ selector, data }: UpdateSurveyScheduleInput, context, skipValidation?: boolean) => {
    const { currentUser, SurveySchedules } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: surveyscheduleSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('SurveySchedules', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, SurveySchedules, surveyscheduleSelector, context) ?? previewDocument as DbSurveySchedule;

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

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveySchedules', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('SurveySchedules', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SurveySchedules', rawResult, context)
});


export { createFunction as createSurveySchedule, updateFunction as updateSurveySchedule };
export { wrappedCreateFunction as createSurveyScheduleMutation, wrappedUpdateFunction as updateSurveyScheduleMutation };


export const graphqlSurveyScheduleTypeDefs = gql`
  input CreateSurveyScheduleDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateSurveyScheduleInput {
    data: CreateSurveyScheduleDataInput!
  }
  
  input UpdateSurveyScheduleDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
