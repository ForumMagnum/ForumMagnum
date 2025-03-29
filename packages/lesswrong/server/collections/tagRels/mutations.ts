
import schema from "@/lib/collections/tagRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('TagRels', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('TagRels', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    // ****************************************************
    // TODO: add missing createBefore callbacks here!!!
    // ****************************************************

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'TagRels', callbackProps);
    let documentWithId = afterCreateProperties.document;

    // ****************************************************
    // TODO: add missing createAfter callbacks here!!!
    // ****************************************************

    await runCountOfReferenceCallbacks({
      collectionName: 'TagRels',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // ****************************************************
    // TODO: add missing newAfter callbacks here!!!
    // ****************************************************

    // ****************************************************
    // TODO: add missing newAsync callbacks here!!!
    // ****************************************************

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'TagRels', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, TagRels } = context;

    const {
      documentSelector: tagrelSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('TagRels', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, TagRels, tagrelSelector, context) ?? previewDocument as DbTagRel;

    // ****************************************************
    // TODO: add missing updateAfter callbacks here!!!
    // ****************************************************

    await runCountOfReferenceCallbacks({
      collectionName: 'TagRels',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'TagRels', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createTagRel, updateFunction as updateTagRel };


export const graphqlTagRelTypeDefs = gql`
  input CreateTagRelInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateTagRelInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createTagRel(input: CreateTagRelInput!): TagRel
    updateTagRel(input: UpdateTagRelInput!): TagRel
  }
`;
