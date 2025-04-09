import schema from "@/lib/collections/postViewTimes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPostViewTimeQueryTypeDefs = gql`
  type PostViewTime ${
    getAllGraphQLFields(schema)
  }

  input SinglePostViewTimeInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePostViewTimeOutput {
    result: PostViewTime
  }

  input MultiPostViewTimeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostViewTimeOutput {
    results: [PostViewTime]
    totalCount: Int
  }

  extend type Query {
    postViewTime(input: SinglePostViewTimeInput): SinglePostViewTimeOutput
    postViewTimes(input: MultiPostViewTimeInput): MultiPostViewTimeOutput
  }
`;

export const postViewTimeGqlQueryHandlers = getDefaultResolvers('PostViewTimes');
export const postViewTimeGqlFieldResolvers = getFieldGqlResolvers('PostViewTimes', schema);
