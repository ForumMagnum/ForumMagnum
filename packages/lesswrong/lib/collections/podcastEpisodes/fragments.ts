import { gql } from "@/lib/generated/gql-codegen";

export const PodcastEpisodeFull = gql(`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`)
