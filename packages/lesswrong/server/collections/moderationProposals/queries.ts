import schema from "@/lib/collections/moderationProposals/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ModerationProposalsViews } from "@/lib/collections/moderationProposals/views";

export const graphqlModerationProposalQueryTypeDefs = gql`
  type ModerationProposal ${ getAllGraphQLFields(schema) }

  input SingleModerationProposalInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleModerationProposalOutput {
    result: ModerationProposal
  }

  input ModerationProposalsProposalsForUserInput {
    targetUserId: String
    statuses: [String!]
  }

  input ModerationProposalSelector {
    default: EmptyViewInput
    proposalsForUser: ModerationProposalsProposalsForUserInput
    pendingProposals: EmptyViewInput
  }

  input MultiModerationProposalInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiModerationProposalOutput {
    results: [ModerationProposal!]!
    totalCount: Int
  }

  extend type Query {
    moderationProposal(
      input: SingleModerationProposalInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleModerationProposalOutput
    moderationProposals(
      input: MultiModerationProposalInput @deprecated(reason: "Use the selector field instead"),
      selector: ModerationProposalSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiModerationProposalOutput
  }
`;
export const moderationProposalGqlQueryHandlers = getDefaultResolvers('ModerationProposals', ModerationProposalsViews);
export const moderationProposalGqlFieldResolvers = getFieldGqlResolvers('ModerationProposals', schema);
