import schema from "@/lib/collections/advisorRequests/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { AdvisorRequestsViews } from "@/lib/collections/advisorRequests/views";

export const graphqlAdvisorRequestQueryTypeDefs = gql`
  type AdvisorRequest ${ getAllGraphQLFields(schema) }
  
  input SingleAdvisorRequestInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleAdvisorRequestOutput {
    result: AdvisorRequest
  }
  
  input AdvisorRequestDefaultViewInput
  
  input AdvisorRequestsRequestsByUserInput {
    userId: String
  }
  
  input AdvisorRequestSelector  {
    default: AdvisorRequestDefaultViewInput
    requestsByUser: AdvisorRequestsRequestsByUserInput
  }
  
  input MultiAdvisorRequestInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiAdvisorRequestOutput {
    results: [AdvisorRequest]
    totalCount: Int
  }
  
  extend type Query {
    advisorRequest(
      input: SingleAdvisorRequestInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleAdvisorRequestOutput
    advisorRequests(
      input: MultiAdvisorRequestInput @deprecated(reason: "Use the selector field instead"),
      selector: AdvisorRequestSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiAdvisorRequestOutput
  }
`;
export const advisorRequestGqlQueryHandlers = getDefaultResolvers('AdvisorRequests', AdvisorRequestsViews);
export const advisorRequestGqlFieldResolvers = getFieldGqlResolvers('AdvisorRequests', schema);
