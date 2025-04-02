
import schema from "@/lib/collections/postEmbeddings/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
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
  createFunction: async ({ data }: CreatePostEmbeddingInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PostEmbeddings', {
      context,
      data,
      schema,
      skipValidation,
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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePostEmbeddingInput, context, skipValidation?: boolean) => {
    const { currentUser, PostEmbeddings } = context;

    const {
      documentSelector: postembeddingSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PostEmbeddings', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostEmbeddings', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('PostEmbeddings', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostEmbeddings', rawResult, context)
});


export { createFunction as createPostEmbedding, updateFunction as updatePostEmbedding };
export { wrappedCreateFunction as createPostEmbeddingMutation, wrappedUpdateFunction as updatePostEmbeddingMutation };


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
