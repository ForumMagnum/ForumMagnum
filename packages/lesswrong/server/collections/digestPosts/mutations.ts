
import schema from "@/lib/collections/digestPosts/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateDigestPostDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbDigestPost | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createDigestPost({ data }: CreateDigestPostInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('DigestPosts', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'DigestPosts', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('DigestPosts', documentWithId);

  return documentWithId;
}

export async function updateDigestPost({ selector, data }: UpdateDigestPostInput, context: ResolverContext) {
  const { currentUser, DigestPosts } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: digestpostSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('DigestPosts', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, DigestPosts, digestpostSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('DigestPosts', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: DigestPosts, oldDocument, data: origData });

  return updatedDocument;
}

export const createDigestPostGqlMutation = makeGqlCreateMutation('DigestPosts', createDigestPost, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'DigestPosts', rawResult, context)
});

export const updateDigestPostGqlMutation = makeGqlUpdateMutation('DigestPosts', updateDigestPost, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'DigestPosts', rawResult, context)
});




export const graphqlDigestPostTypeDefs = gql`
  input CreateDigestPostDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateDigestPostInput {
    data: CreateDigestPostDataInput!
  }
  
  input UpdateDigestPostDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateDigestPostInput {
    selector: SelectorInput!
    data: UpdateDigestPostDataInput!
  }
  
  type DigestPostOutput {
    data: DigestPost
  }

  extend type Mutation {
    createDigestPost(data: CreateDigestPostDataInput!): DigestPostOutput
    updateDigestPost(selector: SelectorInput!, data: UpdateDigestPostDataInput!): DigestPostOutput
  }
`;
