
import schema from "@/lib/collections/digests/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { backdatePreviousDigest, createNextDigestOnPublish } from "@/server/callbacks/digestCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateDigestDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbDigest | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createDigest({ data }: CreateDigestInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Digests', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Digests', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Digests', documentWithId);

  return documentWithId;
}

export async function updateDigest({ selector, data }: UpdateDigestInput, context: ResolverContext) {
  const { currentUser, Digests } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: digestSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Digests', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Digests, digestSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Digests', updatedDocument, oldDocument);

  await createNextDigestOnPublish(updateCallbackProperties);
  await backdatePreviousDigest(updateCallbackProperties);

  void logFieldChanges({ currentUser, collection: Digests, oldDocument, data: origData });

  return updatedDocument;
}

export const createDigestGqlMutation = makeGqlCreateMutation('Digests', createDigest, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Digests', rawResult, context)
});

export const updateDigestGqlMutation = makeGqlUpdateMutation('Digests', updateDigest, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Digests', rawResult, context)
});




export const graphqlDigestTypeDefs = gql`
  input CreateDigestDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateDigestInput {
    data: CreateDigestDataInput!
  }
  
  input UpdateDigestDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateDigestInput {
    selector: SelectorInput!
    data: UpdateDigestDataInput!
  }
  
  type DigestOutput {
    data: Digest
  }

  extend type Mutation {
    createDigest(data: CreateDigestDataInput!): DigestOutput
    updateDigest(selector: SelectorInput!, data: UpdateDigestDataInput!): DigestOutput
  }
`;
