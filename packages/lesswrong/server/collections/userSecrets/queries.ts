import schema from "@/lib/collections/userSecrets/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import { UserSecretsViews } from "@/lib/collections/userSecrets/views";
import gql from "graphql-tag";

export const graphqlUserSecretQueryTypeDefs = gql`
  type UserSecret ${ getAllGraphQLFields(schema) }

  input SingleUserSecretInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleUserSecretOutput {
    result: UserSecret
  }

  input UserSecretSelector {
    mySecrets: EmptyViewInput
  }

  input MultiUserSecretInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiUserSecretOutput {
    results: [UserSecret!]!
    totalCount: Int
  }

  extend type Query {
    userSecret(
      selector: SelectorInput
    ): SingleUserSecretOutput
    userSecrets(
      selector: UserSecretSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserSecretOutput
  }
`;

export const userSecretGqlQueryHandlers = getDefaultResolvers('UserSecrets', UserSecretsViews);
export const userSecretGqlFieldResolvers = getFieldGqlResolvers('UserSecrets', schema);
