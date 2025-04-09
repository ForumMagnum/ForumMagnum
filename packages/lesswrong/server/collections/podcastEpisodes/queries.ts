import schema from "@/lib/collections/podcastEpisodes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPodcastEpisodeQueryTypeDefs = gql`
  type PodcastEpisode ${
    getAllGraphQLFields(schema)
  }

  input SinglePodcastEpisodeInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePodcastEpisodeOutput {
    result: PodcastEpisode
  }

  input MultiPodcastEpisodeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPodcastEpisodeOutput {
    results: [PodcastEpisode]
    totalCount: Int
  }

  extend type Query {
    podcastEpisode(input: SinglePodcastEpisodeInput): SinglePodcastEpisodeOutput
    podcastEpisodes(input: MultiPodcastEpisodeInput): MultiPodcastEpisodeOutput
  }
`;

export const podcastEpisodeGqlQueryHandlers = getDefaultResolvers('PodcastEpisodes');
export const podcastEpisodeGqlFieldResolvers = getFieldGqlResolvers('PodcastEpisodes', schema);
