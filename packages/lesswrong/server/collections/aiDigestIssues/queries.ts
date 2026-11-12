import schema from "@/lib/collections/aiDigestIssues/newSchema";
import { AiDigestIssuesViews } from "@/lib/collections/aiDigestIssues/views";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlAiDigestIssueQueryTypeDefs = gql`
  type AiDigestIssue ${ getAllGraphQLFields(schema) }

  enum AiDigestIssueTrigger {
    adminSample
    userPreview
    scheduled
  }

  type SingleAiDigestIssueOutput {
    result: AiDigestIssue
  }

  input AiDigestIssuesRecipientIssuesInput {
    recipientId: String
  }

  input AiDigestIssueSelector {
    default: EmptyViewInput
    recipientIssues: AiDigestIssuesRecipientIssuesInput
  }

  type MultiAiDigestIssueOutput {
    results: [AiDigestIssue!]!
    totalCount: Int
  }

  extend type Query {
    aiDigestIssue(
      selector: SelectorInput
    ): SingleAiDigestIssueOutput
    aiDigestIssues(
      selector: AiDigestIssueSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiAiDigestIssueOutput
  }
`;

export const aiDigestIssueGqlQueryHandlers = getDefaultResolvers('AiDigestIssues', AiDigestIssuesViews);
export const aiDigestIssueGqlFieldResolvers = getFieldGqlResolvers('AiDigestIssues', schema);
