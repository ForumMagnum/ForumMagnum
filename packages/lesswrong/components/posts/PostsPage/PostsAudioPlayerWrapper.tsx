import React from 'react';
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

export const PostsAudioPlayerWrapper = ({post, showEmbeddedPlayer, onPlaybackChange}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  showEmbeddedPlayer: boolean,
  onPlaybackChange?: (isPlaying: boolean) => void,
}) => {
  const classes = useStyles(styles);

  return <>
    {('podcastEpisode' in post) && post.podcastEpisode && <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
      <PostsPodcastPlayer podcastEpisode={post.podcastEpisode} postId={post._id} />
    </div>}
    {isPostAllowedType3Audio(post) && <T3AudioPlayer
      showEmbeddedPlayer={!!showEmbeddedPlayer}
      documentId={post._id}
      collectionName="Posts"
      onPlaybackChange={onPlaybackChange}
    />}
  </>;
}

export default PostsAudioPlayerWrapper;


