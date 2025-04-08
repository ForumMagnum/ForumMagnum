
import schema from "@/lib/collections/userJobAds/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
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
  createFunction: async ({ data }: CreateUserJobAdInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('UserJobAds', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

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

  updateFunction: async ({ selector, data }: UpdateUserJobAdInput, context) => {
    const { currentUser, UserJobAds } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: userjobadSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('UserJobAds', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, UserJobAds, userjobadSelector, context);

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

export const createUserJobAdGqlMutation = makeGqlCreateMutation('UserJobAds', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserJobAds', rawResult, context)
});

export const updateUserJobAdGqlMutation = makeGqlUpdateMutation('UserJobAds', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserJobAds', rawResult, context)
});


export { createFunction as createUserJobAd, updateFunction as updateUserJobAd };


export const graphqlUserJobAdTypeDefs = gql`
  input CreateUserJobAdDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateUserJobAdInput {
    data: CreateUserJobAdDataInput!
  }
  
  input UpdateUserJobAdDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
