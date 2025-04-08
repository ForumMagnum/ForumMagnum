
import schema from "@/lib/collections/postViewTimes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
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


const { createFunction, updateFunction } = getDefaultMutationFunctions('PostViewTimes', {
  createFunction: async ({ data }: CreatePostViewTimeInput, context) => {
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
  },

  updateFunction: async ({ selector, data }: UpdatePostViewTimeInput, context) => {
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
  },
});

export const createPostViewTimeGqlMutation = makeGqlCreateMutation('PostViewTimes', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViewTimes', rawResult, context)
});

export const updatePostViewTimeGqlMutation = makeGqlUpdateMutation('PostViewTimes', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViewTimes', rawResult, context)
});


export { createFunction as createPostViewTime, updateFunction as updatePostViewTime };


export const graphqlPostViewTimeTypeDefs = gql`
  input CreatePostViewTimeDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreatePostViewTimeInput {
    data: CreatePostViewTimeDataInput!
  }
  
  input UpdatePostViewTimeDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
