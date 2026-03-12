import schema from "@/lib/collections/automatedContentEvaluations/newSchema";
import gql from "graphql-tag";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";

export const graphqlAutomatedContentEvaluationQueryTypeDefs = gql`
  type AutomatedContentEvaluation ${ getAllGraphQLFields(schema) }

  type SentenceScore {
    sentence: String!
    score: Float!
  }

  type PangramWindowScore {
    text: String!
    score: Float!
    startIndex: Int!
    endIndex: Int!
  }
`;

export const automatedContentEvaluationGqlFieldResolvers = getFieldGqlResolvers('AutomatedContentEvaluations', schema);
