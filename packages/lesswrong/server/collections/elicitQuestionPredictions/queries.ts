import schema from "@/lib/collections/elicitQuestionPredictions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlElicitQuestionPredictionQueryTypeDefs = gql`
  type ElicitQuestionPrediction {
    ${getAllGraphQLFields(schema)}
  }

  input SingleElicitQuestionPredictionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleElicitQuestionPredictionOutput {
    result: ElicitQuestionPrediction
  }

  input MultiElicitQuestionPredictionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiElicitQuestionPredictionOutput {
    results: [ElicitQuestionPrediction]
    totalCount: Int
  }

  extend type Query {
    elicitQuestionPrediction(input: SingleElicitQuestionPredictionInput): SingleElicitQuestionPredictionOutput
    elicitQuestionPredictions(input: MultiElicitQuestionPredictionInput): MultiElicitQuestionPredictionOutput
  }
`;

export const elicitQuestionPredictionGqlQueryHandlers = getDefaultResolvers('ElicitQuestionPredictions');
export const elicitQuestionPredictionGqlFieldResolvers = getFieldGqlResolvers('ElicitQuestionPredictions', schema);
