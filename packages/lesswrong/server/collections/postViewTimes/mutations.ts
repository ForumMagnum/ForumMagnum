
import schema from "@/lib/collections/postViewTimes/newSchema";
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


function newCheck(user: DbUser | null, document: CreatePostViewTimeDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostViewTime | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('PostViewTimes', {
  createFunction: async ({ data }: CreatePostViewTimeInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PostViewTimes', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostViewTimes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostViewTimes',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePostViewTimeInput, context, skipValidation?: boolean) => {
    const { currentUser, PostViewTimes } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: postviewtimeSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PostViewTimes', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, PostViewTimes, postviewtimeSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'PostViewTimes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: PostViewTimes, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViewTimes', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('PostViewTimes', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViewTimes', rawResult, context)
});


export { createFunction as createPostViewTime, updateFunction as updatePostViewTime };
export { wrappedCreateFunction as createPostViewTimeMutation, wrappedUpdateFunction as updatePostViewTimeMutation };


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
