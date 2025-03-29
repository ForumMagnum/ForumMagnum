
import schema from "@/lib/collections/userJobAds/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbUserJobAd>> | null, context: ResolverContext) {
  return userCanDo(user, [
    'userjobad.create',
    'userjobads.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbUserJobAd | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'userjobad.update.own',
      'userjobads.edit.own',
    ])
    : userCanDo(user, [
      'userjobad.update.all',
      'userjobads.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('UserJobAds', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserJobAds', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserJobAds', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserJobAds',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'UserJobAds', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, UserJobAds } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: userjobadSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserJobAds', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, UserJobAds, userjobadSelector, context) ?? previewDocument as DbUserJobAd;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserJobAds',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: UserJobAds, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'UserJobAds', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createUserJobAd, updateFunction as updateUserJobAd };


export const graphqlUserJobAdTypeDefs = gql`
  input CreateUserJobAdInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateUserJobAdInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createUserJobAd(input: CreateUserJobAdInput!): UserJobAd
    updateUserJobAd(input: UpdateUserJobAdInput!): UserJobAd
  }
`;
