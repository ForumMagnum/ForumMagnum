import schema from "@/lib/collections/votes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { VotesViews } from "@/lib/collections/votes/views";

export const graphqlVoteQueryTypeDefs = gql`
  type Vote ${ getAllGraphQLFields(schema) }
  
  input SingleVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleVoteOutput {
    result: Vote
  }
  
  input VoteViewInput {
    voteType: String
    collectionName: String
    collectionNames: String
    after: String
    before: String
   }
  
  input VoteSelector @oneOf {
    default: VoteViewInput
    tagVotes: VoteViewInput
    userPostVotes: VoteViewInput
    userVotes: VoteViewInput
  }
  
  input MultiVoteInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
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
