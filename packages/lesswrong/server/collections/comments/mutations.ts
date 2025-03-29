
import schema from "@/lib/collections/comments/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('Comments', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Comments', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    // ****************************************************
    // TODO: add missing createValidate callbacks here!!!
    // ****************************************************

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    // ****************************************************
    // TODO: add missing createBefore callbacks here!!!
    // ****************************************************

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    // ****************************************************
    // TODO: add missing newSync callbacks here!!!
    // ****************************************************

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Comments', callbackProps);
    let documentWithId = afterCreateProperties.document;

    // ****************************************************
    // TODO: add missing createAfter callbacks here!!!
    // ****************************************************

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Comments',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // ****************************************************
    // TODO: add missing newAfter callbacks here!!!
    // ****************************************************

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    // ****************************************************
    // TODO: add missing createAsync callbacks here!!!
    // ****************************************************

    if (isElasticEnabled) {
      void elasticSyncDocument('Comments', documentWithId._id);
    }

    // ****************************************************
    // TODO: add missing newAsync callbacks here!!!
    // ****************************************************

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Comments', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, Comments } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: commentSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Comments', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    // ****************************************************
    // TODO: add missing updateValidate callbacks here!!!
    // ****************************************************

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    // ****************************************************
    // TODO: add missing updateBefore callbacks here!!!
    // ****************************************************

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // ****************************************************
    // TODO: add missing editSync callbacks here!!!
    // ****************************************************

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Comments, commentSelector, context) ?? previewDocument as DbComment;

    // ****************************************************
    // TODO: add missing updateAfter callbacks here!!!
    // ****************************************************

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Comments',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // ****************************************************
    // TODO: add missing updateAsync callbacks here!!!
    // ****************************************************

    // ****************************************************
    // TODO: add missing editAsync callbacks here!!!
    // ****************************************************

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    if (isElasticEnabled) {
      void elasticSyncDocument('Comments', updatedDocument._id);
    }

    void logFieldChanges({ currentUser, collection: Comments, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Comments', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createComment, updateFunction as updateComment };


export const graphqlCommentTypeDefs = gql`
  input CreateCommentInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateCommentInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createComment(input: CreateCommentInput!): Comment
    updateComment(input: UpdateCommentInput!): Comment
  }
`;
