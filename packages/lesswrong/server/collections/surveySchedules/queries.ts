import schema from "@/lib/collections/surveySchedules/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { SurveySchedulesViews } from "@/lib/collections/surveySchedules/views";

export const graphqlSurveyScheduleQueryTypeDefs = gql`
  type SurveySchedule ${ getAllGraphQLFields(schema) }
  
  input SingleSurveyScheduleInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSurveyScheduleOutput {
    result: SurveySchedule
  }
  
  input SurveyScheduleDefaultViewInput
  
  input SurveySchedulesSurveySchedulesByCreatedAtInput
  
  input SurveyScheduleSelector  {
    default: SurveyScheduleDefaultViewInput
    surveySchedulesByCreatedAt: SurveySchedulesSurveySchedulesByCreatedAtInput
  }
  
  input MultiSurveyScheduleInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSurveyScheduleOutput {
    results: [SurveySchedule]
    totalCount: Int
  }
  
  extend type Query {
    surveySchedule(
      input: SingleSurveyScheduleInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSurveyScheduleOutput
    surveySchedules(
      input: MultiSurveyScheduleInput @deprecated(reason: "Use the selector field instead"),
      selector: SurveyScheduleSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSurveyScheduleOutput
  }
`;
export const surveyScheduleGqlQueryHandlers = getDefaultResolvers('SurveySchedules', SurveySchedulesViews);
export const surveyScheduleGqlFieldResolvers = getFieldGqlResolvers('SurveySchedules', schema);
