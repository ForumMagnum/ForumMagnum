import schema from "@/lib/collections/rssfeeds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlRSSFeedQueryTypeDefs = gql`
  type RSSFeed ${
    getAllGraphQLFields(schema)
  }

  input SingleRSSFeedInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleRSSFeedOutput {
    result: RSSFeed
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
    rSSFeed(input: SingleRSSFeedInput): SingleRSSFeedOutput
    rSSFeeds(input: MultiRSSFeedInput): MultiRSSFeedOutput
  }
`;

export const rssfeedGqlQueryHandlers = getDefaultResolvers('RSSFeeds');
export const rssfeedGqlFieldResolvers = getFieldGqlResolvers('RSSFeeds', schema);
