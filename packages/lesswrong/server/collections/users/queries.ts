import schema from "@/lib/collections/users/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserQueryTypeDefs = gql`
  type User ${
    getAllGraphQLFields(schema)
  }

  input SingleUserInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleUserOutput {
    result: User
  }

  input MultiUserInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserOutput {
    results: [User]
    totalCount: Int
  }

  extend type Query {
    user(input: SingleUserInput): SingleUserOutput
    users(input: MultiUserInput): MultiUserOutput
  }
`;

export const userGqlQueryHandlers = getDefaultResolvers('Users');
export const userGqlFieldResolvers = getFieldGqlResolvers('Users', schema);
