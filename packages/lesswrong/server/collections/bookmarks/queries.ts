import schema from "@/lib/collections/bookmarks/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import gql from "graphql-tag";

export const graphqlBookmarkQueryTypeDefs = gql`
  type Bookmark {
    ${getAllGraphQLFields(schema)}
  }
`;

export const bookmarkGqlQueryHandlers = getDefaultResolvers('Bookmarks');
export const bookmarkGqlFieldResolvers = getFieldGqlResolvers('Bookmarks', schema);
