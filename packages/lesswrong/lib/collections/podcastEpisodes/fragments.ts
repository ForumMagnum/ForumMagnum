import { frag } from "@/lib/fragments/fragmentWrapper";

export const PodcastEpisodeFull = () => gql`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`
