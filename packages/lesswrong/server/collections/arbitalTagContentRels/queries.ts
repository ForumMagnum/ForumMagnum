import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlArbitalTagContentRelQueryTypeDefs = gql`
  type ArbitalTagContentRel {
    ${getAllGraphQLFields(schema)}
  }

  input SingleArbitalTagContentRelInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleArbitalTagContentRelOutput {
    result: ArbitalTagContentRel
  }

  input MultiArbitalTagContentRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiArbitalTagContentRelOutput {
    results: [ArbitalTagContentRel]
    totalCount: Int
  }

  extend type Query {
    arbitalTagContentRel(input: SingleArbitalTagContentRelInput): SingleArbitalTagContentRelOutput
    arbitalTagContentRels(input: MultiArbitalTagContentRelInput): MultiArbitalTagContentRelOutput
  }
`;

export const arbitalTagContentRelGqlQueryHandlers = getDefaultResolvers('ArbitalTagContentRels');
export const arbitalTagContentRelGqlFieldResolvers = getFieldGqlResolvers('ArbitalTagContentRels', schema);
