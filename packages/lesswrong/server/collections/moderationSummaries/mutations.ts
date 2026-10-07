import schema from "@/lib/collections/moderationSummaries/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

function editCheck(user: DbUser | null, document: DbModerationSummary | null) {
  if (!user || !document) return false;
  return userIsAdminOrMod(user);
}

export async function createModerationSummary({ data }: CreateModerationSummaryInput, context: ResolverContext) {
  if (data.kind === 'userSummary' && !data.targetUserId) {
    throw new Error("A userSummary requires a targetUserId");
  }
  if (data.kind === 'userGrouping' && !data.memberUserIds?.length) {
    throw new Error("A userGrouping requires memberUserIds");
  }

  const callbackProps = await getLegacyCreateCallbackProps('ModerationSummaries', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModerationSummaries', callbackProps);
  const documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ModerationSummaries', documentWithId);

  return documentWithId;
}

export async function updateModerationSummary({ selector, data }: UpdateModerationSummaryInput, context: ResolverContext) {
  const { currentUser, ModerationSummaries } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: moderationSummarySelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ModerationSummaries', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  const updatedDocument = await updateAndReturnDocument(data, ModerationSummaries, moderationSummarySelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ModerationSummaries', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: ModerationSummaries, oldDocument, data: origData }));

  return updatedDocument;
}

export const createModerationSummaryGqlMutation = makeGqlCreateMutation('ModerationSummaries', createModerationSummary, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationSummaries', rawResult, context)
});

export const updateModerationSummaryGqlMutation = makeGqlUpdateMutation('ModerationSummaries', updateModerationSummary, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationSummaries', rawResult, context)
});

export const graphqlModerationSummaryTypeDefs = gql`
  input CreateModerationSummaryDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateModerationSummaryInput {
    data: CreateModerationSummaryDataInput!
  }

  input UpdateModerationSummaryDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateModerationSummaryInput {
    selector: SelectorInput!
    data: UpdateModerationSummaryDataInput!
  }

  type ModerationSummaryOutput {
    data: ModerationSummary
  }

  extend type Mutation {
    createModerationSummary(data: CreateModerationSummaryDataInput!): ModerationSummaryOutput
    updateModerationSummary(selector: SelectorInput!, data: UpdateModerationSummaryDataInput!): ModerationSummaryOutput
  }
`;
