import schema from "@/lib/collections/electionVotes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ElectionVotesViews } from "@/lib/collections/electionVotes/views";

export const graphqlElectionVoteQueryTypeDefs = gql`
  type ElectionVote ${ getAllGraphQLFields(schema) }
  
  input SingleElectionVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleElectionVoteOutput {
    result: ElectionVote
  }
  
  input ElectionVoteViewInput {
    electionName: String
    userId: String
   }
  
  input ElectionVoteSelector @oneOf {
    default: ElectionVoteViewInput
    allSubmittedVotes: ElectionVoteViewInput
  }
  
  input MultiElectionVoteInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiElectionVoteOutput {
    results: [ElectionVote]
    totalCount: Int
  }
  
  extend type Query {
    electionVote(
      input: SingleElectionVoteInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleElectionVoteOutput
    electionVotes(
      input: MultiElectionVoteInput @deprecated(reason: "Use the selector field instead"),
      selector: ElectionVoteSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiElectionVoteOutput
  }
`;
export const electionVoteGqlQueryHandlers = getDefaultResolvers('ElectionVotes', ElectionVotesViews);
export const electionVoteGqlFieldResolvers = getFieldGqlResolvers('ElectionVotes', schema);
