import schema from "@/lib/collections/posts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPostQueryTypeDefs = gql`
  type Post ${
    getAllGraphQLFields(schema)
  }

  input SinglePostInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePostOutput {
    result: Post
  }

  input MultiPostInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostOutput {
    results: [Post]
    totalCount: Int
  }

  extend type Query {
    post(input: SinglePostInput): SinglePostOutput
    posts(input: MultiPostInput): MultiPostOutput
  }
`;

export const postGqlQueryHandlers = getDefaultResolvers('Posts');
export const postGqlFieldResolvers = getFieldGqlResolvers('Posts', schema);
