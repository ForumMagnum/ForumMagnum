import schema from "@/lib/collections/bookmarks/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import gql from "graphql-tag";
import { BookmarksViews } from "@/lib/collections/bookmarks/views";

export const graphqlBookmarkQueryTypeDefs = gql`
  type Bookmark ${ getAllGraphQLFields(schema) }

  input SingleBookmarkInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }
  
  type SingleBookmarkOutput {
    result: Bookmark
  }

  input BookmarksUserDocumentBookmarkInput {
    userId: String
    documentId: String
    collectionName: String
  }


  input BookmarkSelector {
    myBookmarkedPosts: EmptyViewInput
    myBookmarks: EmptyViewInput
    userDocumentBookmark: BookmarksUserDocumentBookmarkInput
  }
  
  input MultiBookmarkInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiBookmarkOutput {
    results: [Bookmark!]!
    totalCount: Int
  }

  extend type Query {
    bookmark(
      input: SingleBookmarkInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleBookmarkOutput
    bookmarks(
      input: MultiBookmarkInput @deprecated(reason: "Use the selector field instead"),
      selector: BookmarkSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiBookmarkOutput
  }
`;

export const bookmarkGqlQueryHandlers = getDefaultResolvers('Bookmarks', BookmarksViews);
export const bookmarkGqlFieldResolvers = getFieldGqlResolvers('Bookmarks', schema);
