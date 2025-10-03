import schema from "@/lib/collections/moderationTemplates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateModerationTemplateDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbModerationTemplate | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createModerationTemplate({ data }: CreateModerationTemplateInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ModerationTemplates', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModerationTemplates', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ModerationTemplates', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateModerationTemplate({ selector, data }: UpdateModerationTemplateInput, context: ResolverContext) {
  const { currentUser, ModerationTemplates } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: moderationtemplateSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ModerationTemplates', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, ModerationTemplates, moderationtemplateSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ModerationTemplates', updatedDocument, oldDocument);

  reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  backgroundTask(logFieldChanges({ currentUser, collection: ModerationTemplates, oldDocument, data: origData }));

  return updatedDocument;
}

export const createModerationTemplateGqlMutation = makeGqlCreateMutation('ModerationTemplates', createModerationTemplate, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationTemplates', rawResult, context)
});

export const updateModerationTemplateGqlMutation = makeGqlUpdateMutation('ModerationTemplates', updateModerationTemplate, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModerationTemplates', rawResult, context)
});




export const graphqlModerationTemplateTypeDefs = gql`
  input CreateModerationTemplateDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateModerationTemplateInput {
    data: CreateModerationTemplateDataInput!
  }
  
  input UpdateModerationTemplateDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateModerationTemplateInput {
    selector: SelectorInput!
    data: UpdateModerationTemplateDataInput!
  }
  
  type ModerationTemplateOutput {
    data: ModerationTemplate
  }

  extend type Mutation {
    createModerationTemplate(data: CreateModerationTemplateDataInput!): ModerationTemplateOutput
    updateModerationTemplate(selector: SelectorInput!, data: UpdateModerationTemplateDataInput!): ModerationTemplateOutput
  }
`;
