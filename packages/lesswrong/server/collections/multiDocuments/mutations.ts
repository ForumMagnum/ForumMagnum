
import { canMutateParentDocument } from "@/lib/collections/multiDocuments/helpers";
import schema from "@/lib/collections/multiDocuments/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { reindexParentTagIfNeeded } from "@/server/callbacks/multiDocumentCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, multiDocument: CreateMultiDocumentDataInput | null, context: ResolverContext) {
  return canMutateParentDocument(user, multiDocument, 'create', context);
}

async function editCheck(user: DbUser | null, multiDocument: DbMultiDocument | null, context: ResolverContext) {
  if (!multiDocument) {
    return false;
  }

  const canEditParent = await canMutateParentDocument(user, multiDocument, 'update', context);
  if (!canEditParent) {
    return false;
  }

  // If the multi-document is deleted, we also need to check if the user owns it
  if (multiDocument.deleted) {
    return userIsAdmin(user) || userOwns(user, multiDocument);
  }

  return true;
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('MultiDocuments', {
  createFunction: async ({ data }: CreateMultiDocumentInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('MultiDocuments', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'MultiDocuments', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'MultiDocuments',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    reindexParentTagIfNeeded(documentWithId);

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateMultiDocumentInput, context, skipValidation?: boolean) => {
    const { currentUser, MultiDocuments } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: multidocumentSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('MultiDocuments', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, MultiDocuments, multidocumentSelector, context) ?? previewDocument as DbMultiDocument;

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'MultiDocuments',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    reindexParentTagIfNeeded(updatedDocument);

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: MultiDocuments, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'MultiDocuments', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('MultiDocuments', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'MultiDocuments', rawResult, context)
});


export { createFunction as createMultiDocument, updateFunction as updateMultiDocument };
export { wrappedCreateFunction as createMultiDocumentMutation, wrappedUpdateFunction as updateMultiDocumentMutation };


export const graphqlMultiDocumentTypeDefs = gql`
  input CreateMultiDocumentDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateMultiDocumentInput {
    data: CreateMultiDocumentDataInput!
  }
  
  input UpdateMultiDocumentDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateMultiDocumentInput {
    selector: SelectorInput!
    data: UpdateMultiDocumentDataInput!
  }
  
  extend type Mutation {
    createMultiDocument(input: CreateMultiDocumentInput!): MultiDocument
    updateMultiDocument(input: UpdateMultiDocumentInput!): MultiDocument
  }
`;
