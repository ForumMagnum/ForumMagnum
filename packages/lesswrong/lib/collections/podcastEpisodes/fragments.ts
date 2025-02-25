import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment PodcastEpisodeFull on PodcastEpisode {
    _id
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`);
