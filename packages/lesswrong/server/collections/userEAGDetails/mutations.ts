
import schema from "@/lib/collections/userEAGDetails/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
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


export async function createUserEAGDetail({ data }: CreateUserEAGDetailInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('UserEAGDetails', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserEAGDetails', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('UserEAGDetails', documentWithId);

  return documentWithId;
}

export async function updateUserEAGDetail({ selector, data }: UpdateUserEAGDetailInput, context: ResolverContext) {
  const { currentUser, UserEAGDetails } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: usereagdetailSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('UserEAGDetails', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, UserEAGDetails, usereagdetailSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('UserEAGDetails', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: UserEAGDetails, oldDocument, data: origData });

  return updatedDocument;
}

export const createUserEAGDetailGqlMutation = makeGqlCreateMutation('UserEAGDetails', createUserEAGDetail, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserEAGDetails', rawResult, context)
});

export const updateUserEAGDetailGqlMutation = makeGqlUpdateMutation('UserEAGDetails', updateUserEAGDetail, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserEAGDetails', rawResult, context)
});




export const graphqlUserEAGDetailTypeDefs = gql`
  input CreateUserEAGDetailDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateUserEAGDetailInput {
    data: CreateUserEAGDetailDataInput!
  }
  
  input UpdateUserEAGDetailDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
