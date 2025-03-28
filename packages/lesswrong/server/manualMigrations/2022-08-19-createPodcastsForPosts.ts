import { registerMigration } from './migrationUtils';
import { Podcasts } from '../../server/collections/podcasts/collection';
import { PodcastEpisodes } from '../../server/collections/podcastEpisodes/collection';
import { Posts } from '../../server/collections/posts/collection';

import razPostToBuzzsproutMappings from './resources/razPostToBuzzsproutMappings.json';
import curatedPostToBuzzsproutMappings from './resources/curatedPostToBuzzsproutMappings.json';

type EpisodeMapping = typeof razPostToBuzzsproutMappings;

interface CreateEpisodeData {
  podcastId: string;
  title: string;
  episodeLink: string;
  externalEpisodeId: string;
}

// TODO: external links
const RAZ_PODCAST = {
  title: 'Rationality: From AI to Zombies',
  // applePodcastLink: '',
  // spotifyPodcastLink: ''
};

// TODO: external links
const CURATED_PODCAST = {
  title: 'LessWrong Curated Podcast',
  // applePodcastLink: '',
  // spotifyPodcastLink: ''
};

const convertEpisodeData = (podcastId: string, episodeData: EpisodeMapping[keyof EpisodeMapping]): CreateEpisodeData => ({
  podcastId,
  title: episodeData.serverTitle,
  episodeLink: episodeData.episodeLink,
  externalEpisodeId: episodeData.externalEpisodeId.toString()
});

export default registerMigration({
  name: 'CreatePodcastsForPosts',
  dateWritten: '2022-08-19',
  idempotent: true,
  action: async () => {
    const [razPodcastId, curatedPodcastId] = await Promise.all([Podcasts.rawInsert(RAZ_PODCAST), Podcasts.rawInsert(CURATED_PODCAST)]);

    const razEpisodes = Object.entries(razPostToBuzzsproutMappings);

    await Promise.all(razEpisodes.map(async ([postId, episodeData]) => {
      const createEpisodeData = convertEpisodeData(razPodcastId, episodeData);
      const podcastEpisodeId = await PodcastEpisodes.rawInsert(createEpisodeData);
      return Posts.rawUpdateOne({ _id: postId }, { $set: { podcastEpisodeId } });
    }));

    const curatedEpisodes = Object.entries(curatedPostToBuzzsproutMappings);

    await Promise.all(curatedEpisodes.map(async ([postId, episodeData]) => {
      const createEpisodeData = convertEpisodeData(curatedPodcastId, episodeData);
      const podcastEpisodeId = await PodcastEpisodes.rawInsert(createEpisodeData);
      return Posts.rawUpdateOne({ _id: postId }, { $set: { podcastEpisodeId } });
    }));
  }
});
