
import schema from "@/lib/collections/postViewTimes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreatePostViewTimeDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostViewTime | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createPostViewTime({ data }: CreatePostViewTimeInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('PostViewTimes', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostViewTimes', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('PostViewTimes', documentWithId);

  return documentWithId;
}

export async function updatePostViewTime({ selector, data }: UpdatePostViewTimeInput, context: ResolverContext) {
  const { currentUser, PostViewTimes } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: postviewtimeSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('PostViewTimes', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, PostViewTimes, postviewtimeSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PostViewTimes', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: PostViewTimes, oldDocument, data: origData });

  return updatedDocument;
}

export const createPostViewTimeGqlMutation = makeGqlCreateMutation('PostViewTimes', createPostViewTime, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViewTimes', rawResult, context)
});

export const updatePostViewTimeGqlMutation = makeGqlUpdateMutation('PostViewTimes', updatePostViewTime, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViewTimes', rawResult, context)
});




export const graphqlPostViewTimeTypeDefs = gql`
  input CreatePostViewTimeDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreatePostViewTimeInput {
    data: CreatePostViewTimeDataInput!
  }
  
  input UpdatePostViewTimeDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdatePostViewTimeInput {
    selector: SelectorInput!
    data: UpdatePostViewTimeDataInput!
  }
  
  type PostViewTimeOutput {
    data: PostViewTime
  }

  extend type Mutation {
    createPostViewTime(data: CreatePostViewTimeDataInput!): PostViewTimeOutput
    updatePostViewTime(selector: SelectorInput!, data: UpdatePostViewTimeDataInput!): PostViewTimeOutput
  }
`;
