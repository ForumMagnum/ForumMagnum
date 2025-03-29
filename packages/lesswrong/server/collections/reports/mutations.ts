
import schema from "@/lib/collections/reports/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbReport>> | null, context: ResolverContext) {
  return userCanDo(user, [
    'report.create',
    'reports.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbReport | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'report.update.own',
      'reports.edit.own',
    ])
    : userCanDo(user, [
      'report.update.all',
      'reports.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Reports', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Reports', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Reports', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Reports',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Reports', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, Reports } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: reportSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Reports', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Reports, reportSelector, context) ?? previewDocument as DbReport;

    await runCountOfReferenceCallbacks({
      collectionName: 'Reports',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // ****************************************************
    // TODO: add missing editAsync callbacks here!!!
    // ****************************************************

    void logFieldChanges({ currentUser, collection: Reports, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Reports', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createReport, updateFunction as updateReport };


export const graphqlReportTypeDefs = gql`
  input CreateReportInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateReportInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createReport(input: CreateReportInput!): Report
    updateReport(input: UpdateReportInput!): Report
  }
`;
