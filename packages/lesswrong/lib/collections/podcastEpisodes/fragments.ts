import { gql } from "@/lib/crud/wrapGql";

export const PodcastEpisodeFull = gql(`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`)
