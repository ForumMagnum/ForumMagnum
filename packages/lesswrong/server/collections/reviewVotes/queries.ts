import schema from "@/lib/collections/reviewVotes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ReviewVotesViews } from "@/lib/collections/reviewVotes/views";

export const graphqlReviewVoteQueryTypeDefs = gql`
  type ReviewVote ${ getAllGraphQLFields(schema) }
  
  input SingleReviewVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleReviewVoteOutput {
    result: ReviewVote
  }
  
  input ReviewVotesReviewVotesFromUserInput {
    userId: String
    year: String
  }
  
  input ReviewVotesReviewVotesAdminDashboardInput {
    year: Int
  }
  
  input ReviewVoteSelector {
    default: EmptyViewInput
    reviewVotesFromUser: ReviewVotesReviewVotesFromUserInput
    reviewVotesForPost: EmptyViewInput
    reviewVotesForPostAndUser: EmptyViewInput
    reviewVotesAdminDashboard: ReviewVotesReviewVotesAdminDashboardInput
  }
  
  input MultiReviewVoteInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiReviewVoteOutput {
    results: [ReviewVote!]!
    totalCount: Int
  }
  
  extend type Query {
    reviewVote(
      input: SingleReviewVoteInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleReviewVoteOutput
    reviewVotes(
      input: MultiReviewVoteInput @deprecated(reason: "Use the selector field instead"),
      selector: ReviewVoteSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiReviewVoteOutput
  }
`;
export const reviewVoteGqlQueryHandlers = getDefaultResolvers('ReviewVotes', ReviewVotesViews);
export const reviewVoteGqlFieldResolvers = getFieldGqlResolvers('ReviewVotes', schema);
