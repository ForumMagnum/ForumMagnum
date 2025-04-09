import schema from "@/lib/collections/revisions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlRevisionQueryTypeDefs = gql`
  type Revision ${
    getAllGraphQLFields(schema)
  }

  input SingleRevisionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleRevisionOutput {
    result: Revision
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
    revision(input: SingleRevisionInput): SingleRevisionOutput
    revisions(input: MultiRevisionInput): MultiRevisionOutput
  }
`;

export const revisionGqlQueryHandlers = getDefaultResolvers('Revisions');
export const revisionGqlFieldResolvers = getFieldGqlResolvers('Revisions', schema);
