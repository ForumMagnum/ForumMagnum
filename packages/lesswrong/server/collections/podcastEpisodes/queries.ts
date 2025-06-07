import schema from "@/lib/collections/podcastEpisodes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { PodcastEpisodesViews } from "@/lib/collections/podcastEpisodes/views";

export const graphqlPodcastEpisodeQueryTypeDefs = gql`
  type PodcastEpisode ${ getAllGraphQLFields(schema) }
  
  input SinglePodcastEpisodeInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePodcastEpisodeOutput {
    result: PodcastEpisode
  }
  
  input PodcastEpisodeByExternalIdInput {
    externalEpisodeId: String
    _id: String
  }

  input PodcastEpisodeSelector {
    default: EmptyViewInput
    episodeByExternalId: PodcastEpisodeByExternalIdInput
  }
  
  input MultiPodcastEpisodeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiPodcastEpisodeOutput {
    results: [PodcastEpisode!]!
    totalCount: Int
  }
  
  extend type Query {
    podcastEpisode(
      input: SinglePodcastEpisodeInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePodcastEpisodeOutput
    podcastEpisodes(
      input: MultiPodcastEpisodeInput @deprecated(reason: "Use the selector field instead"),
      selector: PodcastEpisodeSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPodcastEpisodeOutput
  }
`;
export const podcastEpisodeGqlQueryHandlers = getDefaultResolvers('PodcastEpisodes', PodcastEpisodesViews);
export const podcastEpisodeGqlFieldResolvers = getFieldGqlResolvers('PodcastEpisodes', schema);
