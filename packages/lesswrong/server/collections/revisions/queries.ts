import schema from "@/lib/collections/revisions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { RevisionsViews } from "@/lib/collections/revisions/views";

export const graphqlRevisionQueryTypeDefs = gql`
  type Revision ${ getAllGraphQLFields(schema) }
  
  input SingleRevisionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleRevisionOutput {
    result: Revision
  }
  
  input RevisionViewInput {
    documentId: String
    fieldName: String
    before: String
    after: String
    userId: String
    version: String
   }
  
  input RevisionSelector @oneOf {
    default: RevisionViewInput
    revisionsByUser: RevisionViewInput
    revisionsOnDocument: RevisionViewInput
    revisionByVersionNumber: RevisionViewInput
  }
  
  input MultiRevisionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiRevisionOutput {
    results: [Revision]
    totalCount: Int
  }
  
  extend type Query {
    revision(
      input: SingleRevisionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleRevisionOutput
    revisions(
      input: MultiRevisionInput @deprecated(reason: "Use the selector field instead"),
      selector: RevisionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiRevisionOutput
  }
`;
export const revisionGqlQueryHandlers = getDefaultResolvers('Revisions', RevisionsViews);
export const revisionGqlFieldResolvers = getFieldGqlResolvers('Revisions', schema);
