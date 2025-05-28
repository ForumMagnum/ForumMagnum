
import { userCanUseTags } from "@/lib/betas";
import schema from "@/lib/collections/userTagRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, userTagRel: CreateUserTagRelDataInput | null) {
  return userCanUseTags(user);
}

function editCheck(user: DbUser | null, userTagRel: DbUserTagRel | null) {
  return userCanUseTags(user);
}

export async function createUserTagRel({ data }: CreateUserTagRelInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('UserTagRels', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserTagRels', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('UserTagRels', documentWithId);

  return documentWithId;
}

export async function updateUserTagRel({ selector, data }: UpdateUserTagRelInput, context: ResolverContext) {
  const { currentUser, UserTagRels } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: usertagrelSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('UserTagRels', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, UserTagRels, usertagrelSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('UserTagRels', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: UserTagRels, oldDocument, data: origData });

  return updatedDocument;
}

export const createUserTagRelGqlMutation = makeGqlCreateMutation('UserTagRels', createUserTagRel, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserTagRels', rawResult, context)
});

export const updateUserTagRelGqlMutation = makeGqlUpdateMutation('UserTagRels', updateUserTagRel, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserTagRels', rawResult, context)
});




export const graphqlUserTagRelTypeDefs = gql`
  input CreateUserTagRelDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateUserTagRelInput {
    data: CreateUserTagRelDataInput!
  }
  
  input UpdateUserTagRelDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateUserTagRelInput {
    selector: SelectorInput!
    data: UpdateUserTagRelDataInput!
  }
  
  type UserTagRelOutput {
    data: UserTagRel
  }

  extend type Mutation {
    createUserTagRel(data: CreateUserTagRelDataInput!): UserTagRelOutput
    updateUserTagRel(selector: SelectorInput!, data: UpdateUserTagRelDataInput!): UserTagRelOutput
  }
`;
