
import schema from "@/lib/collections/postEmbeddings/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";


function newCheck(user: DbUser | null, document: CreatePostEmbeddingDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostEmbedding | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('PostEmbeddings', {
  createFunction: async ({ data }: CreatePostEmbeddingInput, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PostEmbeddings', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostEmbeddings', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostEmbeddings',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'PostEmbeddings', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdatePostEmbeddingInput, context) => {
    const { currentUser, PostEmbeddings } = context;

    const {
      documentSelector: postembeddingSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PostEmbeddings', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, PostEmbeddings, postembeddingSelector, context) ?? previewDocument as DbPostEmbedding;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostEmbeddings',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'PostEmbeddings', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createPostEmbedding, updateFunction as updatePostEmbedding };


export const graphqlPostEmbeddingTypeDefs = gql`
  input CreatePostEmbeddingDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreatePostEmbeddingInput {
    data: CreatePostEmbeddingDataInput!
  }
  
  input UpdatePostEmbeddingDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdatePostEmbeddingInput {
    selector: SelectorInput!
    data: UpdatePostEmbeddingDataInput!
  }
  
  extend type Mutation {
    createPostEmbedding(input: CreatePostEmbeddingInput!): PostEmbedding
    updatePostEmbedding(input: UpdatePostEmbeddingInput!): PostEmbedding
  }
`;
