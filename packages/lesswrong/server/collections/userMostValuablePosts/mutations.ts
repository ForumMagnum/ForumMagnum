
import schema from "@/lib/collections/userMostValuablePosts/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateUserMostValuablePostDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'usermostvaluablepost.create',
    'usermostvaluableposts.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbUserMostValuablePost | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'usermostvaluablepost.update.own',
      'usermostvaluableposts.edit.own',
    ])
    : userCanDo(user, [
      'usermostvaluablepost.update.all',
      'usermostvaluableposts.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('UserMostValuablePosts', {
  createFunction: async ({ data }: CreateUserMostValuablePostInput, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserMostValuablePosts', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserMostValuablePosts', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserMostValuablePosts',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'UserMostValuablePosts', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdateUserMostValuablePostInput, context) => {
    const { currentUser, UserMostValuablePosts } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: usermostvaluablepostSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserMostValuablePosts', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, UserMostValuablePosts, usermostvaluablepostSelector, context) ?? previewDocument as DbUserMostValuablePost;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserMostValuablePosts',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: UserMostValuablePosts, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'UserMostValuablePosts', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createUserMostValuablePost, updateFunction as updateUserMostValuablePost };


export const graphqlUserMostValuablePostTypeDefs = gql`
  input CreateUserMostValuablePostDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateUserMostValuablePostInput {
    data: CreateUserMostValuablePostDataInput!
  }
  
  input UpdateUserMostValuablePostDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateUserMostValuablePostInput {
    selector: SelectorInput!
    data: UpdateUserMostValuablePostDataInput!
  }
  
  extend type Mutation {
    createUserMostValuablePost(input: CreateUserMostValuablePostInput!): UserMostValuablePost
    updateUserMostValuablePost(input: UpdateUserMostValuablePostInput!): UserMostValuablePost
  }
`;
