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

  type AIDetectionComparisonItem {
    documentId: String!
    collectionName: String!
    title: String
    htmlPreview: String!
    postedAt: Date!
    baseScore: Int!
    authorDisplayName: String
    authorSlug: String
    rejected: Boolean!
    automatedContentEvaluation: AutomatedContentEvaluation
  }

  extend type Query {
    getAIDetectionComparisonItems(
      limit: Int
      offset: Int
    ): [AIDetectionComparisonItem!]!
  }

  extend type Mutation {
    runPangramCheck(documentId: String!, collectionName: ContentCollectionName!): AutomatedContentEvaluation!
  }
`;

export const automatedContentEvaluationGqlFieldResolvers = getFieldGqlResolvers('AutomatedContentEvaluations', schema);
