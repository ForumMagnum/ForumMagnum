
import schema from "@/lib/collections/postViews/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreatePostViewsDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostViews | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('PostViews', {
  createFunction: async ({ data }: CreatePostViewsInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PostViews', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostViews', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostViews',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePostViewsInput, context, skipValidation?: boolean) => {
    const { currentUser, PostViews } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: postviewsSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PostViews', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, PostViews, postviewsSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'PostViews',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: PostViews, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createPostViewsGqlMutation = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViews', rawResult, context)
});

export const updatePostViewsGqlMutation = makeGqlUpdateMutation('PostViews', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViews', rawResult, context)
});


export { createFunction as createPostViews, updateFunction as updatePostViews };


export const graphqlPostViewsTypeDefs = gql`
  input CreatePostViewsDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreatePostViewsInput {
    data: CreatePostViewsDataInput!
  }
  
  input UpdatePostViewsDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
