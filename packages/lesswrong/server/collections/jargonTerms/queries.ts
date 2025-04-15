import schema from "@/lib/collections/jargonTerms/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlJargonTermQueryTypeDefs = gql`
  type JargonTerm {
    ${getAllGraphQLFields(schema)}
  }

  input SingleJargonTermInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleJargonTermOutput {
    result: JargonTerm
  }

  input MultiJargonTermInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiJargonTermOutput {
    results: [JargonTerm]
    totalCount: Int
  }

  extend type Query {
    jargonTerm(input: SingleJargonTermInput): SingleJargonTermOutput
    jargonTerms(input: MultiJargonTermInput): MultiJargonTermOutput
  }
`;

export const jargonTermGqlQueryHandlers = getDefaultResolvers('JargonTerms');
export const jargonTermGqlFieldResolvers = getFieldGqlResolvers('JargonTerms', schema);
