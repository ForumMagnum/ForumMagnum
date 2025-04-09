import schema from "@/lib/collections/ckEditorUserSessions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCkEditorUserSessionQueryTypeDefs = gql`
  type CkEditorUserSession ${
    getAllGraphQLFields(schema)
  }

  input SingleCkEditorUserSessionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleCkEditorUserSessionOutput {
    result: CkEditorUserSession
  }

  input MultiCkEditorUserSessionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiCkEditorUserSessionOutput {
    results: [CkEditorUserSession]
    totalCount: Int
  }

  extend type Query {
    ckEditorUserSession(input: SingleCkEditorUserSessionInput): SingleCkEditorUserSessionOutput
    ckEditorUserSessions(input: MultiCkEditorUserSessionInput): MultiCkEditorUserSessionOutput
  }
`;

export const ckEditorUserSessionGqlQueryHandlers = getDefaultResolvers('CkEditorUserSessions');
export const ckEditorUserSessionGqlFieldResolvers = getFieldGqlResolvers('CkEditorUserSessions', schema);
