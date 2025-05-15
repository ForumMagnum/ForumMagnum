import schema from "@/lib/collections/rssfeeds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { RSSFeedsViews } from "@/lib/collections/rssfeeds/views";

export const graphqlRssfeedQueryTypeDefs = gql`
  type RSSFeed ${ getAllGraphQLFields(schema) }
  
  input SingleRSSFeedInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleRSSFeedOutput {
    result: RSSFeed
  }
  
  input RSSFeedDefaultViewInput
  
  input RSSFeedsUsersFeedInput {
    userId: String
  }
  
  input RSSFeedSelector  {
    default: RSSFeedDefaultViewInput
    usersFeed: RSSFeedsUsersFeedInput
  }
  
  input MultiRSSFeedInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiRSSFeedOutput {
    results: [RSSFeed]
    totalCount: Int
  }
  
  extend type Query {
    rSSFeed(
      input: SingleRSSFeedInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleRSSFeedOutput
    rSSFeeds(
      input: MultiRSSFeedInput @deprecated(reason: "Use the selector field instead"),
      selector: RSSFeedSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiRSSFeedOutput
  }
`;
export const rssfeedGqlQueryHandlers = getDefaultResolvers('RSSFeeds', RSSFeedsViews);
export const rssfeedGqlFieldResolvers = getFieldGqlResolvers('RSSFeeds', schema);
