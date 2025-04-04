import { frag } from "@/lib/fragments/fragmentWrapper";

export const PodcastEpisodeFull = () => frag`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`
