import schema from "@/lib/collections/surveys/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSurveyQueryTypeDefs = gql`
  type Survey {
    ${getAllGraphQLFields(schema)}
  }

  input SingleSurveyInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSurveyOutput {
    result: Survey
  }

  input MultiSurveyInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiSurveyOutput {
    results: [Survey]
    totalCount: Int
  }

  extend type Query {
    survey(input: SingleSurveyInput): SingleSurveyOutput
    surveys(input: MultiSurveyInput): MultiSurveyOutput
  }
`;

export const surveyGqlQueryHandlers = getDefaultResolvers('Surveys');
export const surveyGqlFieldResolvers = getFieldGqlResolvers('Surveys', schema);
