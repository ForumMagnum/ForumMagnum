import schema from "@/lib/collections/typingIndicators/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlTypingIndicatorQueryTypeDefs = gql`
  type TypingIndicator ${ getAllGraphQLFields(schema) }
  
  input SingleTypingIndicatorInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleTypingIndicatorOutput {
    result: TypingIndicator
  }
  
  input TypingIndicatorViewInput
  
  input TypingIndicatorSelector  {
    default: TypingIndicatorViewInput
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
    typingIndicator(
      input: SingleTypingIndicatorInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleTypingIndicatorOutput
    typingIndicators(
      input: MultiTypingIndicatorInput @deprecated(reason: "Use the selector field instead"),
      selector: TypingIndicatorSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiTypingIndicatorOutput
  }
`;
export const typingIndicatorGqlQueryHandlers = getDefaultResolvers('TypingIndicators', new CollectionViewSet('TypingIndicators', {}));
export const typingIndicatorGqlFieldResolvers = getFieldGqlResolvers('TypingIndicators', schema);
