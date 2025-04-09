import schema from "@/lib/collections/podcasts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPodcastQueryTypeDefs = gql`
  type Podcast {
    ${getAllGraphQLFields(schema)}
  }

  input SinglePodcastInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePodcastOutput {
    result: Podcast
  }

  input MultiPodcastInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPodcastOutput {
    results: [Podcast]
    totalCount: Int
  }

  extend type Query {
    podcast(input: SinglePodcastInput): SinglePodcastOutput
    podcasts(input: MultiPodcastInput): MultiPodcastOutput
  }
`;

export const podcastGqlQueryHandlers = getDefaultResolvers('Podcasts');
export const podcastGqlFieldResolvers = getFieldGqlResolvers('Podcasts', schema);
