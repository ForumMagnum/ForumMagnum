
import schema from "@/lib/collections/spotlights/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


function newCheck(user: DbUser | null, document: CreateSpotlightDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSpotlight | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createSpotlight({ data }: CreateSpotlightInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Spotlights', {
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

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Spotlights', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Spotlights', documentWithId);

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

export async function updateSpotlight({ selector, data }: UpdateSpotlightInput, context: ResolverContext) {
  const { currentUser, Spotlights } = context;

  const {
    documentSelector: spotlightSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Spotlights', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, Spotlights, spotlightSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Spotlights', updatedDocument, updateCallbackProperties.oldDocument);

  reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  return updatedDocument;
}

export const createSpotlightGqlMutation = makeGqlCreateMutation('Spotlights', createSpotlight, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Spotlights', rawResult, context)
});

export const updateSpotlightGqlMutation = makeGqlUpdateMutation('Spotlights', updateSpotlight, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Spotlights', rawResult, context)
});




export const graphqlSpotlightTypeDefs = gql`
  input CreateSpotlightDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateSpotlightInput {
    data: CreateSpotlightDataInput!
  }
  
  input UpdateSpotlightDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateSpotlightInput {
    selector: SelectorInput!
    data: UpdateSpotlightDataInput!
  }
  
  type SpotlightOutput {
    data: Spotlight
  }

  extend type Mutation {
    createSpotlight(data: CreateSpotlightDataInput!): SpotlightOutput
    updateSpotlight(selector: SelectorInput!, data: UpdateSpotlightDataInput!): SpotlightOutput
  }
`;
