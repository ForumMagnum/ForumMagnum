import schema from "@/lib/collections/surveyResponses/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlSurveyResponseQueryTypeDefs = gql`
  type SurveyResponse ${ getAllGraphQLFields(schema) }
  
  input SingleSurveyResponseInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSurveyResponseOutput {
    result: SurveyResponse
  }
  
  input SurveyResponseSelector {
    default: EmptyViewInput
  }
  
  input MultiSurveyResponseInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiSurveyResponseOutput {
    results: [SurveyResponse]
    totalCount: Int
  }
  
  extend type Query {
    surveyResponse(
      input: SingleSurveyResponseInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSurveyResponseOutput
    surveyResponses(
      input: MultiSurveyResponseInput @deprecated(reason: "Use the selector field instead"),
      selector: SurveyResponseSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSurveyResponseOutput
  }
`;
export const surveyResponseGqlQueryHandlers = getDefaultResolvers('SurveyResponses', new CollectionViewSet('SurveyResponses', {}));
export const surveyResponseGqlFieldResolvers = getFieldGqlResolvers('SurveyResponses', schema);
