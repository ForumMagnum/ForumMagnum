import schema from "@/lib/collections/userSecrets/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { encryptUserSecret } from "@/server/research/userSecretsCrypto";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return !!user;
}

function editCheck(user: DbUser | null, document: DbUserSecret | null) {
  if (!user || !document) return false;
  return userIsAdmin(user) || userOwns(user, document);
}

export async function createUserSecret(
  { data }: CreateUserSecretInput,
  context: ResolverContext,
) {
  const { currentUser } = context;
  if (!currentUser) throw new Error("Not logged in");

  const repoScope = data.repoScope ?? null;
  // Pre-check uniqueness so the user gets a clear "use update instead" error
  // rather than a DB-level unique-constraint violation from the partial unique
  // index on `(userId, name, repoScope)`.
  const existing = await context.UserSecrets.findOne({ userId: currentUser._id, name: data.name, repoScope });
  if (existing) {
    throw new Error(
      `A secret named "${data.name}"${repoScope ? ` for ${repoScope}` : ""} already exists; use updateUserSecret instead.`,
    );
  }

  const document = {
    userId: currentUser._id,
    repoScope,
    name: data.name,
    encryptedValue: encryptUserSecret(data.value),
  };

  const insertedDocument = await insertAndReturnDocument(document, 'UserSecrets', context);
  return insertedDocument;
}

export async function updateUserSecret(
  { selector, data }: UpdateUserSecretInput,
  context: ResolverContext,
) {
  const { UserSecrets } = context;
  if (!data.value) throw new Error("value required");

  const _id = getDocumentId(selector);

  return await updateAndReturnDocument(
    { encryptedValue: encryptUserSecret(data.value) },
    UserSecrets,
    { _id },
    context,
  );
}

export const createUserSecretGqlMutation = makeGqlCreateMutation('UserSecrets', createUserSecret, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserSecrets', rawResult, context),
});

export const updateUserSecretGqlMutation = makeGqlUpdateMutation('UserSecrets', updateUserSecret, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserSecrets', rawResult, context),
});

export const graphqlUserSecretTypeDefs = gql`
  input CreateUserSecretDataInput ${ getCreatableGraphQLFields(schema) }

  input CreateUserSecretInput {
    data: CreateUserSecretDataInput!
  }

  input UpdateUserSecretDataInput ${ getUpdatableGraphQLFields(schema) }

  input UpdateUserSecretInput {
    selector: SelectorInput!
    data: UpdateUserSecretDataInput!
  }

  type UserSecretOutput {
    data: UserSecret
  }

  extend type Mutation {
    createUserSecret(data: CreateUserSecretDataInput!): UserSecretOutput
    updateUserSecret(selector: SelectorInput!, data: UpdateUserSecretDataInput!): UserSecretOutput
  }
`;
