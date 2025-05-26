import schema from "@/lib/collections/ckEditorUserSessions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlCkEditorUserSessionQueryTypeDefs = gql`
  type CkEditorUserSession ${ getAllGraphQLFields(schema) }
  
  input SingleCkEditorUserSessionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleCkEditorUserSessionOutput {
    result: CkEditorUserSession
  }
  
  input CkEditorUserSessionSelector {
    default: EmptyViewInput
  }
  
  input MultiCkEditorUserSessionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiCkEditorUserSessionOutput {
    results: [CkEditorUserSession!]!
    totalCount: Int
  }
  
  extend type Query {
    ckEditorUserSession(
      input: SingleCkEditorUserSessionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleCkEditorUserSessionOutput
    ckEditorUserSessions(
      input: MultiCkEditorUserSessionInput @deprecated(reason: "Use the selector field instead"),
      selector: CkEditorUserSessionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiCkEditorUserSessionOutput
  }
`;
export const ckEditorUserSessionGqlQueryHandlers = getDefaultResolvers('CkEditorUserSessions', new CollectionViewSet('CkEditorUserSessions', {}));
export const ckEditorUserSessionGqlFieldResolvers = getFieldGqlResolvers('CkEditorUserSessions', schema);
