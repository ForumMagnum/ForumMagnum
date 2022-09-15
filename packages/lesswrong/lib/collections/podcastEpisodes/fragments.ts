import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment FullPodcastEpisode on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`);
