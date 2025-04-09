
import schema from "@/lib/collections/postViews/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreatePostViewsDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostViews | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createPostViews({ data }: CreatePostViewsInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('PostViews', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostViews', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('PostViews', documentWithId);

  return documentWithId;
}

export async function updatePostViews({ selector, data }: UpdatePostViewsInput, context: ResolverContext) {
  const { currentUser, PostViews } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: postviewsSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('PostViews', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, PostViews, postviewsSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PostViews', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: PostViews, oldDocument, data: origData });

  return updatedDocument;
}

export const createPostViewsGqlMutation = makeGqlCreateMutation('PostViews', createPostViews, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViews', rawResult, context)
});

export const updatePostViewsGqlMutation = makeGqlUpdateMutation('PostViews', updatePostViews, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViews', rawResult, context)
});




export const graphqlPostViewsTypeDefs = gql`
  input CreatePostViewsDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreatePostViewsInput {
    data: CreatePostViewsDataInput!
  }
  
  input UpdatePostViewsDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdatePostViewsInput {
    selector: SelectorInput!
    data: UpdatePostViewsDataInput!
  }
  
  type PostViewsOutput {
    data: PostViews
  }

  extend type Mutation {
    createPostViews(data: CreatePostViewsDataInput!): PostViewsOutput
    updatePostViews(selector: SelectorInput!, data: UpdatePostViewsDataInput!): PostViewsOutput
  }
`;
