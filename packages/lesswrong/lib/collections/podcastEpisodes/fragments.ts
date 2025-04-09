import { gql } from "@/lib/generated/gql-codegen/gql";

export const PodcastEpisodeFull = () => gql(`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`)
