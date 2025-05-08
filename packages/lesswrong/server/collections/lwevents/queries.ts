import schema from "@/lib/collections/lwevents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { LWEventsViews } from "@/lib/collections/lwevents/views";

export const graphqlLweventQueryTypeDefs = gql`
  type Lwevent ${ getAllGraphQLFields(schema) }
  
  input SingleLweventInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleLweventOutput {
    result: Lwevent
  }
  
  input LweventViewInput {
    name: String
    postId: String
    userId: String
    postIds: String
   }
  
  input LweventSelector @oneOf {
    default: LweventViewInput
    adminView: LweventViewInput
    postVisits: LweventViewInput
    emailHistory: LweventViewInput
    gatherTownUsers: LweventViewInput
  }
  
  input MultiLweventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiLweventOutput {
    results: [Lwevent]
    totalCount: Int
  }
  
  extend type Query {
    lwevent(
      input: SingleLweventInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleLweventOutput
    lwevents(
      input: MultiLweventInput @deprecated(reason: "Use the selector field instead"),
      selector: LweventSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiLweventOutput
  }
`;
export const lweventGqlQueryHandlers = getDefaultResolvers('LWEvents', LWEventsViews);
export const lweventGqlFieldResolvers = getFieldGqlResolvers('LWEvents', schema);
