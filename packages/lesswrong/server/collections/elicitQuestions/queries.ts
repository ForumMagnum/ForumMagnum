import schema from "@/lib/collections/elicitQuestions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlElicitQuestionQueryTypeDefs = gql`
  type ElicitQuestion ${ getAllGraphQLFields(schema) }
  
  input SingleElicitQuestionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleElicitQuestionOutput {
    result: ElicitQuestion
  }
  
  input ElicitQuestionViewInput
  
  input ElicitQuestionSelector  {
    default: ElicitQuestionViewInput
  }
  
  input MultiElicitQuestionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiElicitQuestionOutput {
    results: [ElicitQuestion]
    totalCount: Int
  }
  
  extend type Query {
    elicitQuestion(
      input: SingleElicitQuestionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleElicitQuestionOutput
    elicitQuestions(
      input: MultiElicitQuestionInput @deprecated(reason: "Use the selector field instead"),
      selector: ElicitQuestionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiElicitQuestionOutput
  }
`;
export const elicitQuestionGqlQueryHandlers = getDefaultResolvers('ElicitQuestions', new CollectionViewSet('ElicitQuestions', {}));
export const elicitQuestionGqlFieldResolvers = getFieldGqlResolvers('ElicitQuestions', schema);
