
import schema from "@/lib/collections/userRateLimits/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateUserRateLimitDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'userratelimit.create',
    'userratelimits.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbUserRateLimit | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'userratelimit.update.own',
      'userratelimits.edit.own',
    ])
    : userCanDo(user, [
      'userratelimit.update.all',
      'userratelimits.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('UserRateLimits', {
  createFunction: async ({ data }: CreateUserRateLimitInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserRateLimits', {
      context,
      data,
      newCheck,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserRateLimits', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserRateLimits',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateUserRateLimitInput, context, skipValidation?: boolean) => {
    const { currentUser, UserRateLimits } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: userratelimitSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserRateLimits', { selector, context, data, editCheck, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, UserRateLimits, userratelimitSelector, context) ?? previewDocument as DbUserRateLimit;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserRateLimits',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: UserRateLimits, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapMutatorFunction(createFunction, (rawResult, context) => accessFilterSingle(context.currentUser, 'UserRateLimits', rawResult, context));
const wrappedUpdateFunction = wrapMutatorFunction(updateFunction, (rawResult, context) => accessFilterSingle(context.currentUser, 'UserRateLimits', rawResult, context));

export { createFunction as createUserRateLimit, updateFunction as updateUserRateLimit };
export { wrappedCreateFunction as createUserRateLimitMutation, wrappedUpdateFunction as updateUserRateLimitMutation };


export const graphqlUserRateLimitTypeDefs = gql`
  input CreateUserRateLimitDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateUserRateLimitInput {
    data: CreateUserRateLimitDataInput!
  }
  
  input UpdateUserRateLimitDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateUserRateLimitInput {
    selector: SelectorInput!
    data: UpdateUserRateLimitDataInput!
  }
  
  extend type Mutation {
    createUserRateLimit(input: CreateUserRateLimitInput!): UserRateLimit
    updateUserRateLimit(input: UpdateUserRateLimitInput!): UserRateLimit
  }
`;
