
import schema from "@/lib/collections/postEmbeddings/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


function newCheck(user: DbUser | null, document: CreatePostEmbeddingDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostEmbedding | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createPostEmbedding({ data }: CreatePostEmbeddingInput, context: ResolverContext) {
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

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('PostEmbeddings', documentWithId);

  return documentWithId;
}

export async function updatePostEmbedding({ selector, data }: UpdatePostEmbeddingInput, context: ResolverContext) {
  const { currentUser, PostEmbeddings } = context;

  const {
    documentSelector: postembeddingSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('PostEmbeddings', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, PostEmbeddings, postembeddingSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PostEmbeddings', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}

export const createPostEmbeddingGqlMutation = makeGqlCreateMutation('PostEmbeddings', createPostEmbedding, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostEmbeddings', rawResult, context)
});

export const updatePostEmbeddingGqlMutation = makeGqlUpdateMutation('PostEmbeddings', updatePostEmbedding, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostEmbeddings', rawResult, context)
});




export const graphqlPostEmbeddingTypeDefs = gql`
  input CreatePostEmbeddingDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreatePostEmbeddingInput {
    data: CreatePostEmbeddingDataInput!
  }
  
  input UpdatePostEmbeddingDataInput ${
    getUpdatableGraphQLFields(schema)
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
