import schema from "@/lib/collections/googleServiceAccountSessions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { GoogleServiceAccountSessionsViews } from "@/lib/collections/googleServiceAccountSessions/views";

export const graphqlGoogleServiceAccountSessionQueryTypeDefs = gql`
  type GoogleServiceAccountSession ${ getAllGraphQLFields(schema) }
  
  input SingleGoogleServiceAccountSessionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleGoogleServiceAccountSessionOutput {
    result: GoogleServiceAccountSession
  }
  
  
  
  input GoogleServiceAccountSessionSelector {
    default: EmptyViewInput
  }
  
  input MultiGoogleServiceAccountSessionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiGoogleServiceAccountSessionOutput {
    results: [GoogleServiceAccountSession!]!
    totalCount: Int
  }
  
  extend type Query {
    googleServiceAccountSession(
      input: SingleGoogleServiceAccountSessionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleGoogleServiceAccountSessionOutput
    googleServiceAccountSessions(
      input: MultiGoogleServiceAccountSessionInput @deprecated(reason: "Use the selector field instead"),
      selector: GoogleServiceAccountSessionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiGoogleServiceAccountSessionOutput
  }
`;
export const googleServiceAccountSessionGqlQueryHandlers = getDefaultResolvers('GoogleServiceAccountSessions', GoogleServiceAccountSessionsViews);
export const googleServiceAccountSessionGqlFieldResolvers = getFieldGqlResolvers('GoogleServiceAccountSessions', schema);
