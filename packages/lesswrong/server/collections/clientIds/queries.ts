import schema from "@/lib/collections/clientIds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ClientIdsViews } from "@/lib/collections/clientIds/views";

export const graphqlClientIdQueryTypeDefs = gql`
  type ClientId ${ getAllGraphQLFields(schema) }
  
  input SingleClientIdInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleClientIdOutput {
    result: ClientId
  }
  
  input ClientIdsGetClientIdInput {
    clientId: String
  }
  
  input ClientIdSelector {
    default: EmptyViewInput
    getClientId: ClientIdsGetClientIdInput
  }
  
  input MultiClientIdInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiClientIdOutput {
    results: [ClientId]
    totalCount: Int
  }
  
  extend type Query {
    clientId(
      input: SingleClientIdInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleClientIdOutput
    clientIds(
      input: MultiClientIdInput @deprecated(reason: "Use the selector field instead"),
      selector: ClientIdSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiClientIdOutput
  }
`;
export const clientIdGqlQueryHandlers = getDefaultResolvers('ClientIds', ClientIdsViews);
export const clientIdGqlFieldResolvers = getFieldGqlResolvers('ClientIds', schema);
