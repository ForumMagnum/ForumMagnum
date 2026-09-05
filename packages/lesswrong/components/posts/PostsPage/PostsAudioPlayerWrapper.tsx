import React, { useState } from 'react';
import classNames from 'classnames';
import { isPostAllowedType3Audio } from '../../../lib/collections/posts/helpers';
import PostsPodcastPlayer from "./PostsPodcastPlayer";
import T3AudioPlayer from "./T3AudioPlayer";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsAudioPlayerWrapper', (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
}));

export const postHasAudioPlayer = (post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes) => {
  return (('podcastEpisode' in post) && post.podcastEpisode)
    || isPostAllowedType3Audio(post);
}

interface PostsPodcastPlayerWithFallbackProps {
  podcastEpisode: Exclude<PostPodcastEpisode['podcastEpisode'], null>
  postId: string
  showEmbeddedPlayer: boolean
}

export const PostsPodcastPlayerWithFallback = ({
  podcastEpisode,
  postId,
  showEmbeddedPlayer,
}: PostsPodcastPlayerWithFallbackProps) => {
  const classes = useStyles(styles);
  const [failedEpisodeLink, setFailedEpisodeLink] = useState<string | null>(null);

  // Some legacy podcast hosts remove their embed scripts while Type3 retains
  // the synced audio. Fall back without hiding audio that is still available.
  if (failedEpisodeLink === podcastEpisode.episodeLink) {
    return <T3AudioPlayer
      showEmbeddedPlayer={showEmbeddedPlayer}
      documentId={postId}
      collectionName="Posts"
    />;
  }

  return <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
    <PostsPodcastPlayer
      podcastEpisode={podcastEpisode}
      postId={postId}
      onLoadError={setFailedEpisodeLink}
    />
  </div>;
}

export const PostsAudioPlayerWrapper = ({post, showEmbeddedPlayer}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  showEmbeddedPlayer: boolean,
}) => {
  const podcastEpisode = ('podcastEpisode' in post) ? post.podcastEpisode : null;

  return <>
    {podcastEpisode
      ? <PostsPodcastPlayerWithFallback
        podcastEpisode={podcastEpisode}
        postId={post._id}
        showEmbeddedPlayer={showEmbeddedPlayer}
      />
      : isPostAllowedType3Audio(post) && <T3AudioPlayer showEmbeddedPlayer={showEmbeddedPlayer} documentId={post._id} collectionName="Posts" />}
  </>;
}

export default PostsAudioPlayerWrapper;


