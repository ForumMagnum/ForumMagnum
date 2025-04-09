import schema from "@/lib/collections/books/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlBookQueryTypeDefs = gql`
  type Book ${
    getAllGraphQLFields(schema)
  }

  input SingleBookInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleBookOutput {
    result: Book
  }

  input MultiBookInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiBookOutput {
    results: [Book]
    totalCount: Int
  }

  extend type Query {
    book(input: SingleBookInput): SingleBookOutput
    books(input: MultiBookInput): MultiBookOutput
  }
`;

export const bookGqlQueryHandlers = getDefaultResolvers('Books');
export const bookGqlFieldResolvers = getFieldGqlResolvers('Books', schema);
