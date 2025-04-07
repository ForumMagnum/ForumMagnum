
import schema from "@/lib/collections/spotlights/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";


function newCheck(user: DbUser | null, document: CreateSpotlightDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSpotlight | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Spotlights', {
  createFunction: async ({ data }: CreateSpotlightInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Spotlights', {
      context,
      data,
      schema,
      skipValidation,
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

    await runCountOfReferenceCallbacks({
      collectionName: 'Spotlights',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSpotlightInput, context, skipValidation?: boolean) => {
    const { currentUser, Spotlights } = context;

    const {
      documentSelector: spotlightSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Spotlights', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Spotlights, spotlightSelector, context) ?? previewDocument as DbSpotlight;

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Spotlights',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Spotlights', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('Spotlights', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Spotlights', rawResult, context)
});


export { createFunction as createSpotlight, updateFunction as updateSpotlight };
export { wrappedCreateFunction as createSpotlightMutation, wrappedUpdateFunction as updateSpotlightMutation };


export const graphqlSpotlightTypeDefs = gql`
  input CreateSpotlightDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateSpotlightInput {
    data: CreateSpotlightDataInput!
  }
  
  input UpdateSpotlightDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
