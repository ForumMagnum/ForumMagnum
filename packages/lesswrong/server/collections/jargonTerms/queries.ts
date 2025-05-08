import schema from "@/lib/collections/jargonTerms/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { JargonTermsViews } from "@/lib/collections/jargonTerms/views";

export const graphqlJargonTermQueryTypeDefs = gql`
  type JargonTerm ${ getAllGraphQLFields(schema) }
  
  input SingleJargonTermInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleJargonTermOutput {
    result: JargonTerm
  }
  
  input JargonTermViewInput {
    postId: String
   }
  
  input JargonTermSelector @oneOf {
    default: JargonTermViewInput
    postEditorJargonTerms: JargonTermViewInput
    glossaryEditAll: JargonTermViewInput
    postsApprovedJargon: JargonTermViewInput
  }
  
  input MultiJargonTermInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiJargonTermOutput {
    results: [JargonTerm]
    totalCount: Int
  }
  
  extend type Query {
    jargonTerm(
      input: SingleJargonTermInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleJargonTermOutput
    jargonTerms(
      input: MultiJargonTermInput @deprecated(reason: "Use the selector field instead"),
      selector: JargonTermSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiJargonTermOutput
  }
`;
export const jargonTermGqlQueryHandlers = getDefaultResolvers('JargonTerms', JargonTermsViews);
export const jargonTermGqlFieldResolvers = getFieldGqlResolvers('JargonTerms', schema);
