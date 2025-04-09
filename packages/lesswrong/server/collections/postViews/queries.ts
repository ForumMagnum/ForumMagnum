import schema from "@/lib/collections/postViews/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPostViewsQueryTypeDefs = gql`
  type PostViews ${
    getAllGraphQLFields(schema)
  }

  input SinglePostViewsInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePostViewsOutput {
    result: PostViews
  }

  input MultiPostViewsInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostViewsOutput {
    results: [PostViews]
    totalCount: Int
  }

  extend type Query {
    postViews(input: SinglePostViewsInput): SinglePostViewsOutput
    postViewses(input: MultiPostViewsInput): MultiPostViewsOutput
  }
`;

export const postViewsGqlQueryHandlers = getDefaultResolvers('PostViews');
export const postViewsGqlFieldResolvers = getFieldGqlResolvers('PostViews', schema);
