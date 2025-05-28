
import schema from "@/lib/collections/userRateLimits/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
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


export async function createUserRateLimit({ data }: CreateUserRateLimitInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('UserRateLimits', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserRateLimits', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('UserRateLimits', documentWithId);

  return documentWithId;
}

export async function updateUserRateLimit({ selector, data }: UpdateUserRateLimitInput, context: ResolverContext) {
  const { currentUser, UserRateLimits } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: userratelimitSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('UserRateLimits', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, UserRateLimits, userratelimitSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('UserRateLimits', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: UserRateLimits, oldDocument, data: origData });

  return updatedDocument;
}

export const createUserRateLimitGqlMutation = makeGqlCreateMutation('UserRateLimits', createUserRateLimit, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserRateLimits', rawResult, context)
});

export const updateUserRateLimitGqlMutation = makeGqlUpdateMutation('UserRateLimits', updateUserRateLimit, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserRateLimits', rawResult, context)
});




export const graphqlUserRateLimitTypeDefs = gql`
  input CreateUserRateLimitDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateUserRateLimitInput {
    data: CreateUserRateLimitDataInput!
  }
  
  input UpdateUserRateLimitDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateUserRateLimitInput {
    selector: SelectorInput!
    data: UpdateUserRateLimitDataInput!
  }
  
  type UserRateLimitOutput {
    data: UserRateLimit
  }

  extend type Mutation {
    createUserRateLimit(data: CreateUserRateLimitDataInput!): UserRateLimitOutput
    updateUserRateLimit(selector: SelectorInput!, data: UpdateUserRateLimitDataInput!): UserRateLimitOutput
  }
`;
