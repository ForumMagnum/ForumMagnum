import schema from "@/lib/collections/votes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { VotesViews } from "@/lib/collections/votes/views";

export const graphqlVoteQueryTypeDefs = gql`
  type Vote ${ getAllGraphQLFields(schema) }

  enum VoteType {
    bigDownvote
    bigUpvote
    neutral
    smallDownvote
    smallUpvote
  }
  
  input SingleVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleVoteOutput {
    result: Vote
  }
  
  input VoteSelector {
    default: EmptyViewInput
    tagVotes: EmptyViewInput
    userPostVotes: EmptyViewInput
    userVotes: EmptyViewInput
  }
  
  input MultiVoteInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiVoteOutput {
    results: [Vote]
    totalCount: Int
  }
  
  extend type Query {
    vote(
      input: SingleVoteInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleVoteOutput
    votes(
      input: MultiVoteInput @deprecated(reason: "Use the selector field instead"),
      selector: VoteSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiVoteOutput
  }
`;
export const voteGqlQueryHandlers = getDefaultResolvers('Votes', VotesViews);
export const voteGqlFieldResolvers = getFieldGqlResolvers('Votes', schema);
