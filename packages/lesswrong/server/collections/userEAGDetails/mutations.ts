
import schema from "@/lib/collections/userEAGDetails/newSchema";
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


function newCheck(user: DbUser | null, document: CreateUserEAGDetailDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'usereagdetail.create',
    'usereagdetails.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbUserEAGDetail | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'usereagdetail.update.own',
      'usereagdetails.edit.own',
    ])
    : userCanDo(user, [
      'usereagdetail.update.all',
      'usereagdetails.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('UserEAGDetails', {
  createFunction: async ({ data }: CreateUserEAGDetailInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserEAGDetails', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserEAGDetails', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserEAGDetails',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateUserEAGDetailInput, context, skipValidation?: boolean) => {
    const { currentUser, UserEAGDetails } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: usereagdetailSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserEAGDetails', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, UserEAGDetails, usereagdetailSelector, context) ?? previewDocument as DbUserEAGDetail;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserEAGDetails',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: UserEAGDetails, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserEAGDetails', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('UserEAGDetails', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserEAGDetails', rawResult, context)
});


export { createFunction as createUserEAGDetail, updateFunction as updateUserEAGDetail };
export { wrappedCreateFunction as createUserEAGDetailMutation, wrappedUpdateFunction as updateUserEAGDetailMutation };


export const graphqlUserEAGDetailTypeDefs = gql`
  input CreateUserEAGDetailDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateUserEAGDetailInput {
    data: CreateUserEAGDetailDataInput!
  }
  
  input UpdateUserEAGDetailDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateUserEAGDetailInput {
    selector: SelectorInput!
    data: UpdateUserEAGDetailDataInput!
  }
  
  type UserEAGDetailOutput {
    data: UserEAGDetail
  }

  extend type Mutation {
    createUserEAGDetail(data: CreateUserEAGDetailDataInput!): UserEAGDetailOutput
    updateUserEAGDetail(selector: SelectorInput!, data: UpdateUserEAGDetailDataInput!): UserEAGDetailOutput
  }
`;
