import schema from "@/lib/collections/moderationProposals/newSchema";
import { validateProposalSteps } from "@/lib/collections/moderationProposals/proposalSteps";
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

function editCheck(user: DbUser | null, document: DbModerationProposal | null) {
  if (!user || !document) return false;
  return userIsAdminOrMod(user);
}

export async function createModerationProposal({ data }: CreateModerationProposalInput, context: ResolverContext) {
  const stepValidation = validateProposalSteps(data.steps);
  if (!stepValidation.valid) {
    throw new Error(`Invalid proposal steps: ${stepValidation.error}`);
  }

  const callbackProps = await getLegacyCreateCallbackProps('ModerationProposals', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModerationProposals', callbackProps);
  const documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ModerationProposals', documentWithId);

  return documentWithId;
}

export async function updateModerationProposal({ selector, data }: UpdateModerationProposalInput, context: ResolverContext) {
  const { currentUser, ModerationProposals } = context;

  if (data.steps !== undefined) {
    const stepValidation = validateProposalSteps(data.steps);
    if (!stepValidation.valid) {
      throw new Error(`Invalid proposal steps: ${stepValidation.error}`);
    }
  }

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: moderationProposalSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ModerationProposals', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  const revisesPlan = data.steps !== undefined || data.rationale !== undefined || data.title !== undefined;
  if (revisesPlan && oldDocument.status !== 'draft' && oldDocument.status !== 'pending') {
    throw new Error(`Cannot revise a proposal with status "${oldDocument.status}"`);
  }

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  const updatedDocument = await updateAndReturnDocument(data, ModerationProposals, moderationProposalSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ModerationProposals', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: ModerationProposals, oldDocument, data: origData }));

  return updatedDocument;
}

export const createModerationProposalGqlMutation = makeGqlCreateMutation('ModerationProposals', createModerationProposal, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationProposals', rawResult, context)
});

export const updateModerationProposalGqlMutation = makeGqlUpdateMutation('ModerationProposals', updateModerationProposal, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationProposals', rawResult, context)
});

export const graphqlModerationProposalTypeDefs = gql`
  input CreateModerationProposalDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateModerationProposalInput {
    data: CreateModerationProposalDataInput!
  }

  input UpdateModerationProposalDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateModerationProposalInput {
    selector: SelectorInput!
    data: UpdateModerationProposalDataInput!
  }

  type ModerationProposalOutput {
    data: ModerationProposal
  }

  extend type Mutation {
    createModerationProposal(data: CreateModerationProposalDataInput!): ModerationProposalOutput
    updateModerationProposal(selector: SelectorInput!, data: UpdateModerationProposalDataInput!): ModerationProposalOutput
  }
`;
