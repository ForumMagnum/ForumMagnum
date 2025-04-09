import schema from "@/lib/collections/surveyQuestions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSurveyQuestionQueryTypeDefs = gql`
  type SurveyQuestion ${
    getAllGraphQLFields(schema)
  }

  input SingleSurveyQuestionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSurveyQuestionOutput {
    result: SurveyQuestion
  }

  input MultiSurveyQuestionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSurveyQuestionOutput {
    results: [SurveyQuestion]
    totalCount: Int
  }

  extend type Query {
    surveyQuestion(input: SingleSurveyQuestionInput): SingleSurveyQuestionOutput
    surveyQuestions(input: MultiSurveyQuestionInput): MultiSurveyQuestionOutput
  }
`;

export const surveyQuestionGqlQueryHandlers = getDefaultResolvers('SurveyQuestions');
export const surveyQuestionGqlFieldResolvers = getFieldGqlResolvers('SurveyQuestions', schema);
