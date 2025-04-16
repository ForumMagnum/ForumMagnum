import schema from "@/lib/collections/typingIndicators/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlTypingIndicatorQueryTypeDefs = gql`
  type TypingIndicator {
    ${getAllGraphQLFields(schema)}
  }

  input SingleTypingIndicatorInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleTypingIndicatorOutput {
    result: TypingIndicator
  }

  input MultiTypingIndicatorInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiTypingIndicatorOutput {
    results: [TypingIndicator]
    totalCount: Int
  }

  extend type Query {
    typingIndicator(input: SingleTypingIndicatorInput): SingleTypingIndicatorOutput
    typingIndicators(input: MultiTypingIndicatorInput): MultiTypingIndicatorOutput
  }
`;

export const typingIndicatorGqlQueryHandlers = getDefaultResolvers('TypingIndicators');
export const typingIndicatorGqlFieldResolvers = getFieldGqlResolvers('TypingIndicators', schema);
