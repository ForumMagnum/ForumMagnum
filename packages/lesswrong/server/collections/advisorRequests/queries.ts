import schema from "@/lib/collections/advisorRequests/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlAdvisorRequestQueryTypeDefs = gql`
  type AdvisorRequest ${
    getAllGraphQLFields(schema)
  }

  input SingleAdvisorRequestInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleAdvisorRequestOutput {
    result: AdvisorRequest
  }

  input MultiAdvisorRequestInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiAdvisorRequestOutput {
    results: [AdvisorRequest]
    totalCount: Int
  }

  extend type Query {
    advisorRequest(input: SingleAdvisorRequestInput): SingleAdvisorRequestOutput
    advisorRequests(input: MultiAdvisorRequestInput): MultiAdvisorRequestOutput
  }
`;

export const advisorRequestGqlQueryHandlers = getDefaultResolvers('AdvisorRequests');
export const advisorRequestGqlFieldResolvers = getFieldGqlResolvers('AdvisorRequests', schema);
