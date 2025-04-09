import schema from "@/lib/collections/clientIds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlClientIdQueryTypeDefs = gql`
  type ClientId ${
    getAllGraphQLFields(schema)
  }

  input SingleClientIdInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleClientIdOutput {
    result: ClientId
  }

  input MultiClientIdInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiClientIdOutput {
    results: [ClientId]
    totalCount: Int
  }

  extend type Query {
    clientId(input: SingleClientIdInput): SingleClientIdOutput
    clientIds(input: MultiClientIdInput): MultiClientIdOutput
  }
`;

export const clientIdGqlQueryHandlers = getDefaultResolvers('ClientIds');
export const clientIdGqlFieldResolvers = getFieldGqlResolvers('ClientIds', schema);
