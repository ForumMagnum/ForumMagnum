import schema from "@/lib/collections/votes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlVoteQueryTypeDefs = gql`
  type Vote {
    ${getAllGraphQLFields(schema)}
  }

  input SingleVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleVoteOutput {
    result: Vote
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
    vote(input: SingleVoteInput): SingleVoteOutput
    votes(input: MultiVoteInput): MultiVoteOutput
  }
`;

export const voteGqlQueryHandlers = getDefaultResolvers('Votes');
export const voteGqlFieldResolvers = getFieldGqlResolvers('Votes', schema);
