
import schema from "@/lib/collections/userJobAds/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateUserJobAdDataInput | null, context: ResolverContext) {
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
  createFunction: async ({ data }: CreateUserJobAdInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserJobAds', {
      context,
      data,
      schema,
      skipValidation,
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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateUserJobAdInput, context, skipValidation?: boolean) => {
    const { currentUser, UserJobAds } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: userjobadSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserJobAds', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserJobAds', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('UserJobAds', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserJobAds', rawResult, context)
});


export { createFunction as createUserJobAd, updateFunction as updateUserJobAd };
export { wrappedCreateFunction as createUserJobAdMutation, wrappedUpdateFunction as updateUserJobAdMutation };


export const graphqlUserJobAdTypeDefs = gql`
  input CreateUserJobAdDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateUserJobAdInput {
    data: CreateUserJobAdDataInput!
  }
  
  input UpdateUserJobAdDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateUserJobAdInput {
    selector: SelectorInput!
    data: UpdateUserJobAdDataInput!
  }
  
  type UserJobAdOutput {
    data: UserJobAd
  }

  extend type Mutation {
    createUserJobAd(data: CreateUserJobAdDataInput!): UserJobAdOutput
    updateUserJobAd(selector: SelectorInput!, data: UpdateUserJobAdDataInput!): UserJobAdOutput
  }
`;
