import schema from "@/lib/collections/surveySchedules/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSurveyScheduleQueryTypeDefs = gql`
  type SurveySchedule {
    ${getAllGraphQLFields(schema)}
  }

  input SingleSurveyScheduleInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSurveyScheduleOutput {
    result: SurveySchedule
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
    surveySchedule(input: SingleSurveyScheduleInput): SingleSurveyScheduleOutput
    surveySchedules(input: MultiSurveyScheduleInput): MultiSurveyScheduleOutput
  }
`;

export const surveyScheduleGqlQueryHandlers = getDefaultResolvers('SurveySchedules');
export const surveyScheduleGqlFieldResolvers = getFieldGqlResolvers('SurveySchedules', schema);
