import schema from "@/lib/collections/elicitQuestions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlElicitQuestionQueryTypeDefs = gql`
  type ElicitQuestion ${
    getAllGraphQLFields(schema)
  }

  input SingleElicitQuestionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleElicitQuestionOutput {
    result: ElicitQuestion
  }

  input MultiElicitQuestionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiElicitQuestionOutput {
    results: [ElicitQuestion]
    totalCount: Int
  }

  extend type Query {
    elicitQuestion(input: SingleElicitQuestionInput): SingleElicitQuestionOutput
    elicitQuestions(input: MultiElicitQuestionInput): MultiElicitQuestionOutput
  }
`;

export const elicitQuestionGqlQueryHandlers = getDefaultResolvers('ElicitQuestions');
export const elicitQuestionGqlFieldResolvers = getFieldGqlResolvers('ElicitQuestions', schema);
