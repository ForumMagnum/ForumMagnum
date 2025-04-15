
import schema from "@/lib/collections/reports/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { maybeSendAkismetReport } from "@/server/akismet";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateReportDataInput | null, context: ResolverContext) {
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


export async function createReport({ data }: CreateReportInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Reports', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Reports', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Reports', documentWithId);

  return documentWithId;
}

export async function updateReport({ selector, data }: UpdateReportInput, context: ResolverContext) {
  const { currentUser, Reports } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: reportSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Reports', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Reports, reportSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Reports', updatedDocument, oldDocument);

  await maybeSendAkismetReport(updatedDocument, oldDocument, context);

  void logFieldChanges({ currentUser, collection: Reports, oldDocument, data: origData });

  return updatedDocument;
}

export const createReportGqlMutation = makeGqlCreateMutation('Reports', createReport, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Reports', rawResult, context)
});

export const updateReportGqlMutation = makeGqlUpdateMutation('Reports', updateReport, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Reports', rawResult, context)
});




export const graphqlReportTypeDefs = gql`
  input CreateReportDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateReportInput {
    data: CreateReportDataInput!
  }
  
  input UpdateReportDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateReportInput {
    selector: SelectorInput!
    data: UpdateReportDataInput!
  }
  
  type ReportOutput {
    data: Report
  }

  extend type Mutation {
    createReport(data: CreateReportDataInput!): ReportOutput
    updateReport(selector: SelectorInput!, data: UpdateReportDataInput!): ReportOutput
  }
`;
