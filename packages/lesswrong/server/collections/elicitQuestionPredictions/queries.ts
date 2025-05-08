import schema from "@/lib/collections/elicitQuestionPredictions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlElicitQuestionPredictionQueryTypeDefs = gql`
  type ElicitQuestionPrediction ${ getAllGraphQLFields(schema) }
  
  input SingleElicitQuestionPredictionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleElicitQuestionPredictionOutput {
    result: ElicitQuestionPrediction
  }
  
  input ElicitQuestionPredictionViewInput
  
  input ElicitQuestionPredictionSelector @oneOf {
    default: ElicitQuestionPredictionViewInput
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
    elicitQuestionPrediction(
      input: SingleElicitQuestionPredictionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleElicitQuestionPredictionOutput
    elicitQuestionPredictions(
      input: MultiElicitQuestionPredictionInput @deprecated(reason: "Use the selector field instead"),
      selector: ElicitQuestionPredictionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiElicitQuestionPredictionOutput
  }
`;
export const elicitQuestionPredictionGqlQueryHandlers = getDefaultResolvers('ElicitQuestionPredictions', new CollectionViewSet('ElicitQuestionPredictions', {}));
export const elicitQuestionPredictionGqlFieldResolvers = getFieldGqlResolvers('ElicitQuestionPredictions', schema);
