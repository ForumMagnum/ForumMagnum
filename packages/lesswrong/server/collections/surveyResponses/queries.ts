import schema from "@/lib/collections/surveyResponses/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSurveyResponseQueryTypeDefs = gql`
  type SurveyResponse ${
    getAllGraphQLFields(schema)
  }

  input SingleSurveyResponseInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSurveyResponseOutput {
    result: SurveyResponse
  }

  input MultiSurveyResponseInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSurveyResponseOutput {
    results: [SurveyResponse]
    totalCount: Int
  }

  extend type Query {
    surveyResponse(input: SingleSurveyResponseInput): SingleSurveyResponseOutput
    surveyResponses(input: MultiSurveyResponseInput): MultiSurveyResponseOutput
  }
`;

export const surveyResponseGqlQueryHandlers = getDefaultResolvers('SurveyResponses');
export const surveyResponseGqlFieldResolvers = getFieldGqlResolvers('SurveyResponses', schema);
