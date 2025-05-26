import schema from "@/lib/collections/surveyQuestions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlSurveyQuestionQueryTypeDefs = gql`
  type SurveyQuestion ${ getAllGraphQLFields(schema) }

  enum SurveyQuestionFormat {
    rank0To10
    text
    multilineText
  }
  
  input SingleSurveyQuestionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSurveyQuestionOutput {
    result: SurveyQuestion
  }
  
  input SurveyQuestionSelector {
    default: EmptyViewInput
  }
  
  input MultiSurveyQuestionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiSurveyQuestionOutput {
    results: [SurveyQuestion!]!
    totalCount: Int
  }
  
  extend type Query {
    surveyQuestion(
      input: SingleSurveyQuestionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSurveyQuestionOutput
    surveyQuestions(
      input: MultiSurveyQuestionInput @deprecated(reason: "Use the selector field instead"),
      selector: SurveyQuestionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSurveyQuestionOutput
  }
`;
export const surveyQuestionGqlQueryHandlers = getDefaultResolvers('SurveyQuestions', new CollectionViewSet('SurveyQuestions', {}));
export const surveyQuestionGqlFieldResolvers = getFieldGqlResolvers('SurveyQuestions', schema);
