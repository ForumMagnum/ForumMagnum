import schema from "@/lib/collections/collections/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCollectionQueryTypeDefs = gql`
  type Collection {
    ${getAllGraphQLFields(schema)}
  }

  input SingleCollectionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleCollectionOutput {
    result: Collection
  }

  input MultiCollectionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiCollectionOutput {
    results: [Collection]
    totalCount: Int
  }

  extend type Query {
    collection(input: SingleCollectionInput): SingleCollectionOutput
    collections(input: MultiCollectionInput): MultiCollectionOutput
  }
`;

export const collectionGqlQueryHandlers = getDefaultResolvers('Collections');
export const collectionGqlFieldResolvers = getFieldGqlResolvers('Collections', schema);
