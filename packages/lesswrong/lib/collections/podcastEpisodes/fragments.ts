import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`);
