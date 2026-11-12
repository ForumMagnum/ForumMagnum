/**
 * @jest-environment jsdom
 */
import '../lib/index';

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { PostsPodcastPlayerWithFallback } from '@/components/posts/PostsPage/PostsAudioPlayerWrapper';

jest.mock('@/components/hooks/useStyles', () => ({
  useStyles: () => ({
    embeddedPlayer: 'embeddedPlayer',
    hideEmbeddedPlayer: 'hideEmbeddedPlayer',
    podcastIconList: 'podcastIconList',
    podcastIcon: 'podcastIcon',
  }),
}));

jest.mock('@/lib/analyticsEvents', () => ({
  useTracking: () => ({ captureEvent: jest.fn() }),
}));

jest.mock('@/components/hooks/useEventListener', () => ({
  useEventListener: jest.fn(),
}));

const podcastEpisode = {
  _id: 'episode-id',
  title: 'Test episode',
  episodeLink: 'https://podcasts.example/test-episode.js',
  externalEpisodeId: 'external-episode-id',
  podcast: {
    _id: 'podcast-id',
    title: 'Test podcast',
    applePodcastLink: null,
    spotifyPodcastLink: null,
  },
} satisfies NonNullable<PostPodcastEpisode['podcastEpisode']>;

describe('PostsPodcastPlayerWithFallback', () => {
  afterEach(() => {
    document.head.querySelectorAll('script').forEach((script) => script.remove());
    window.externalScripts = [];
  });

  it('loads the Type3 player when the podcast embed fails', async () => {
    const { container } = render(
      <PostsPodcastPlayerWithFallback
        podcastEpisode={podcastEpisode}
        postId="post-id"
        showEmbeddedPlayer
      />,
    );

    const podcastScript = document.head.querySelector(`script[src="${podcastEpisode.episodeLink}"]`);
    if (!podcastScript) {
      throw new Error('Expected the podcast embed script to be added');
    }

    fireEvent.error(podcastScript);

    await waitFor(() => {
      expect(container.querySelector(`#buzzsprout-player-${podcastEpisode.externalEpisodeId}`)).toBeNull();
      expect(document.head.querySelector('script[src="https://embed.type3.audio/player.js"]')).not.toBeNull();
    });
  });
});
