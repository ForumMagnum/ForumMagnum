import schema from "@/lib/collections/localgroups/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlLocalgroupQueryTypeDefs = gql`
  type Localgroup {
    ${getAllGraphQLFields(schema)}
  }

  input SingleLocalgroupInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleLocalgroupOutput {
    result: Localgroup
  }

  input MultiLocalgroupInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiLocalgroupOutput {
    results: [Localgroup]
    totalCount: Int
  }

  extend type Query {
    localgroup(input: SingleLocalgroupInput): SingleLocalgroupOutput
    localgroups(input: MultiLocalgroupInput): MultiLocalgroupOutput
  }
`;

export const localgroupGqlQueryHandlers = getDefaultResolvers('Localgroups');
export const localgroupGqlFieldResolvers = getFieldGqlResolvers('Localgroups', schema);
