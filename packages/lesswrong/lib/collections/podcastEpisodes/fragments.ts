import { gql } from "@/lib/generated/gql-codegen";

export const PodcastEpisodeCreateFragment = gql(`
  fragment PodcastEpisodeCreateFragment on PodcastEpisode {
    _id
    schemaVersion
    createdAt
    legacyData
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`);

export const PodcastEpisodeFull = gql(`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`)
