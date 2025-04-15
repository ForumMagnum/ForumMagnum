import schema from "@/lib/collections/electionVotes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlElectionVoteQueryTypeDefs = gql`
  type ElectionVote {
    ${getAllGraphQLFields(schema)}
  }

  input SingleElectionVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleElectionVoteOutput {
    result: ElectionVote
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
    electionVote(input: SingleElectionVoteInput): SingleElectionVoteOutput
    electionVotes(input: MultiElectionVoteInput): MultiElectionVoteOutput
  }
`;

export const electionVoteGqlQueryHandlers = getDefaultResolvers('ElectionVotes');
export const electionVoteGqlFieldResolvers = getFieldGqlResolvers('ElectionVotes', schema);
