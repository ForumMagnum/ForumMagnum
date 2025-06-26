import schema from "@/lib/collections/reviewVotes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlReviewVoteQueryTypeDefs = gql`
  type ReviewVote {
    ${getAllGraphQLFields(schema)}
  }

  input SingleReviewVoteInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleReviewVoteOutput {
    result: ReviewVote
  }

  input MultiReviewVoteInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiReviewVoteOutput {
    results: [ReviewVote]
    totalCount: Int
  }

  extend type Query {
    reviewVote(input: SingleReviewVoteInput): SingleReviewVoteOutput
    reviewVotes(input: MultiReviewVoteInput): MultiReviewVoteOutput
  }
`;

export const reviewVoteGqlQueryHandlers = getDefaultResolvers('ReviewVotes');
export const reviewVoteGqlFieldResolvers = getFieldGqlResolvers('ReviewVotes', schema);
