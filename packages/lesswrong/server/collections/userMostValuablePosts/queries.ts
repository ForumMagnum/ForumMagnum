import schema from "@/lib/collections/userMostValuablePosts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserMostValuablePostQueryTypeDefs = gql`
  type UserMostValuablePost {
    ${getAllGraphQLFields(schema)}
  }

  input SingleUserMostValuablePostInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleUserMostValuablePostOutput {
    result: UserMostValuablePost
  }

  input MultiUserMostValuablePostInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserMostValuablePostOutput {
    results: [UserMostValuablePost]
    totalCount: Int
  }

  extend type Query {
    userMostValuablePost(input: SingleUserMostValuablePostInput): SingleUserMostValuablePostOutput
    userMostValuablePosts(input: MultiUserMostValuablePostInput): MultiUserMostValuablePostOutput
  }
`;

export const userMostValuablePostGqlQueryHandlers = getDefaultResolvers('UserMostValuablePosts');
export const userMostValuablePostGqlFieldResolvers = getFieldGqlResolvers('UserMostValuablePosts', schema);
