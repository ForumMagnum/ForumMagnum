import schema from "@/lib/collections/moderationSummaries/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ModerationSummariesViews } from "@/lib/collections/moderationSummaries/views";

export const graphqlModerationSummaryQueryTypeDefs = gql`
  type ModerationSummary ${ getAllGraphQLFields(schema) }

  input SingleModerationSummaryInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleModerationSummaryOutput {
    result: ModerationSummary
  }

  input ModerationSummariesSummariesForUserInput {
    targetUserId: String
  }

  input ModerationSummarySelector {
    default: EmptyViewInput
    summariesForUser: ModerationSummariesSummariesForUserInput
    groupings: EmptyViewInput
  }

  input MultiModerationSummaryInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiModerationSummaryOutput {
    results: [ModerationSummary!]!
    totalCount: Int
  }

  extend type Query {
    moderationSummary(
      input: SingleModerationSummaryInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleModerationSummaryOutput
    moderationSummaries(
      input: MultiModerationSummaryInput @deprecated(reason: "Use the selector field instead"),
      selector: ModerationSummarySelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiModerationSummaryOutput
  }
`;
export const moderationSummaryGqlQueryHandlers = getDefaultResolvers('ModerationSummaries', ModerationSummariesViews);
export const moderationSummaryGqlFieldResolvers = getFieldGqlResolvers('ModerationSummaries', schema);
