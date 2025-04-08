
import schema from "@/lib/collections/postEmbeddings/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


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

    const callbackProps = await getLegacyCreateCallbackProps('PostEmbeddings', {
      context,
      data,
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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePostEmbeddingInput, context) => {
    const { currentUser, PostEmbeddings } = context;

    const {
      documentSelector: postembeddingSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('PostEmbeddings', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, PostEmbeddings, postembeddingSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'PostEmbeddings',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createPostEmbeddingGqlMutation = makeGqlCreateMutation('PostEmbeddings', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostEmbeddings', rawResult, context)
});

export const updatePostEmbeddingGqlMutation = makeGqlUpdateMutation('PostEmbeddings', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostEmbeddings', rawResult, context)
});


export { createFunction as createPostEmbedding, updateFunction as updatePostEmbedding };


export const graphqlPostEmbeddingTypeDefs = gql`
  input CreatePostEmbeddingDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreatePostEmbeddingInput {
    data: CreatePostEmbeddingDataInput!
  }
  
  input UpdatePostEmbeddingDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdatePostEmbeddingInput {
    selector: SelectorInput!
    data: UpdatePostEmbeddingDataInput!
  }
  
  type PostEmbeddingOutput {
    data: PostEmbedding
  }

  extend type Mutation {
    createPostEmbedding(data: CreatePostEmbeddingDataInput!): PostEmbeddingOutput
    updatePostEmbedding(selector: SelectorInput!, data: UpdatePostEmbeddingDataInput!): PostEmbeddingOutput
  }
`;
