import schema from "@/lib/collections/rssfeeds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { RSSFeedsViews } from "@/lib/collections/rssfeeds/views";

export const graphqlRssfeedQueryTypeDefs = gql`
  type RSSFeed ${ getAllGraphQLFields(schema) }
  
  input SingleRssfeedInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleRssfeedOutput {
    result: RSSFeed
  }
  
  input RSSFeedDefaultViewInput
  
  input RSSFeedsUsersFeedInput {
    userId: String
  }
  
  input RssfeedSelector  {
    default: RSSFeedDefaultViewInput
    usersFeed: RSSFeedsUsersFeedInput
  }
  
  input MultiRssfeedInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiRssfeedOutput {
    results: [RSSFeed]
    totalCount: Int
  }
  
  extend type Query {
    rssfeed(
      input: SingleRssfeedInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleRssfeedOutput
    rssfeeds(
      input: MultiRssfeedInput @deprecated(reason: "Use the selector field instead"),
      selector: RssfeedSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiRssfeedOutput
  }
`;
export const rssfeedGqlQueryHandlers = getDefaultResolvers('RSSFeeds', RSSFeedsViews);
export const rssfeedGqlFieldResolvers = getFieldGqlResolvers('RSSFeeds', schema);
