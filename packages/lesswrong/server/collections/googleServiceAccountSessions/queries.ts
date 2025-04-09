import schema from "@/lib/collections/googleServiceAccountSessions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlGoogleServiceAccountSessionQueryTypeDefs = gql`
  type GoogleServiceAccountSession ${
    getAllGraphQLFields(schema)
  }

  input SingleGoogleServiceAccountSessionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleGoogleServiceAccountSessionOutput {
    result: GoogleServiceAccountSession
  }

  input MultiGoogleServiceAccountSessionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiGoogleServiceAccountSessionOutput {
    results: [GoogleServiceAccountSession]
    totalCount: Int
  }

  extend type Query {
    googleServiceAccountSession(input: SingleGoogleServiceAccountSessionInput): SingleGoogleServiceAccountSessionOutput
    googleServiceAccountSessions(input: MultiGoogleServiceAccountSessionInput): MultiGoogleServiceAccountSessionOutput
  }
`;

export const googleServiceAccountSessionGqlQueryHandlers = getDefaultResolvers('GoogleServiceAccountSessions');
export const googleServiceAccountSessionGqlFieldResolvers = getFieldGqlResolvers('GoogleServiceAccountSessions', schema);
