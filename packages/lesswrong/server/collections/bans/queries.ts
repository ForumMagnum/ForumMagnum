import schema from "@/lib/collections/bans/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlBanQueryTypeDefs = gql`
  type Ban {
    ${getAllGraphQLFields(schema)}
  }

  input SingleBanInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleBanOutput {
    result: Ban
  }

  input MultiBanInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiBanOutput {
    results: [Ban]
    totalCount: Int
  }

  extend type Query {
    ban(input: SingleBanInput): SingleBanOutput
    bans(input: MultiBanInput): MultiBanOutput
  }
`;

export const banGqlQueryHandlers = getDefaultResolvers('Bans');
export const banGqlFieldResolvers = getFieldGqlResolvers('Bans', schema);
