import schema from "@/lib/collections/surveys/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { SurveysViews } from "@/lib/collections/surveys/views";

export const graphqlSurveyQueryTypeDefs = gql`
  type Survey ${ getAllGraphQLFields(schema) }
  
  input SingleSurveyInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSurveyOutput {
    result: Survey
  }
  
  input SurveyViewInput
  
  input SurveySelector @oneOf {
    default: SurveyViewInput
    surveysByCreatedAt: SurveyViewInput
  }
  
  input MultiSurveyInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSurveyOutput {
    results: [Survey]
    totalCount: Int
  }
  
  extend type Query {
    survey(
      input: SingleSurveyInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSurveyOutput
    surveys(
      input: MultiSurveyInput @deprecated(reason: "Use the selector field instead"),
      selector: SurveySelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSurveyOutput
  }
`;
export const surveyGqlQueryHandlers = getDefaultResolvers('Surveys', SurveysViews);
export const surveyGqlFieldResolvers = getFieldGqlResolvers('Surveys', schema);
