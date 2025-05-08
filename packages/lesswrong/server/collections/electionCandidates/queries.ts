import schema from "@/lib/collections/electionCandidates/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ElectionCandidatesViews } from "@/lib/collections/electionCandidates/views";

export const graphqlElectionCandidateQueryTypeDefs = gql`
  type ElectionCandidate ${ getAllGraphQLFields(schema) }
  
  input SingleElectionCandidateInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleElectionCandidateOutput {
    result: ElectionCandidate
  }
  
  input ElectionCandidateViewInput {
    electionName: String
    sortBy: String
   }
  
  input ElectionCandidateSelector @oneOf {
    default: ElectionCandidateViewInput
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
    electionCandidate(
      input: SingleElectionCandidateInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleElectionCandidateOutput
    electionCandidates(
      input: MultiElectionCandidateInput @deprecated(reason: "Use the selector field instead"),
      selector: ElectionCandidateSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiElectionCandidateOutput
  }
`;
export const electionCandidateGqlQueryHandlers = getDefaultResolvers('ElectionCandidates', ElectionCandidatesViews);
export const electionCandidateGqlFieldResolvers = getFieldGqlResolvers('ElectionCandidates', schema);
