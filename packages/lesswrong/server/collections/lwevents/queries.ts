import schema from "@/lib/collections/lwevents/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlLWEventQueryTypeDefs = gql`
  type LWEvent {
    ${getAllGraphQLFields(schema)}
  }

  input SingleLWEventInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleLWEventOutput {
    result: LWEvent
  }

  input MultiLWEventInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiLWEventOutput {
    results: [LWEvent]
    totalCount: Int
  }

  extend type Query {
    lWEvent(input: SingleLWEventInput): SingleLWEventOutput
    lWEvents(input: MultiLWEventInput): MultiLWEventOutput
  }
`;

export const lweventGqlQueryHandlers = getDefaultResolvers('LWEvents');
export const lweventGqlFieldResolvers = getFieldGqlResolvers('LWEvents', schema);
