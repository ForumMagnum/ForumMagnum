import schema from "@/lib/collections/electionCandidates/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlElectionCandidateQueryTypeDefs = gql`
  type ElectionCandidate ${
    getAllGraphQLFields(schema)
  }

  input SingleElectionCandidateInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleElectionCandidateOutput {
    result: ElectionCandidate
  }

  input MultiElectionCandidateInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiElectionCandidateOutput {
    results: [ElectionCandidate]
    totalCount: Int
  }

  extend type Query {
    electionCandidate(input: SingleElectionCandidateInput): SingleElectionCandidateOutput
    electionCandidates(input: MultiElectionCandidateInput): MultiElectionCandidateOutput
  }
`;

export const electionCandidateGqlQueryHandlers = getDefaultResolvers('ElectionCandidates');
export const electionCandidateGqlFieldResolvers = getFieldGqlResolvers('ElectionCandidates', schema);
