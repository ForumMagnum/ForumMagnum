import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isPostAllowedType3Audio } from '../../../lib/collections/posts/helpers';
import { PostsPodcastPlayer } from "./PostsPodcastPlayer";
import { T3AudioPlayer } from "./T3AudioPlayer";

const styles = (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
});

export const postHasAudioPlayer = (post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes) => {
  return (('podcastEpisode' in post) && post.podcastEpisode)
    || isPostAllowedType3Audio(post);
}

export const PostsAudioPlayerWrapperInner = ({post, showEmbeddedPlayer, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  showEmbeddedPlayer: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  return <>
    {('podcastEpisode' in post) && post.podcastEpisode && <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
      <PostsPodcastPlayer podcastEpisode={post.podcastEpisode} postId={post._id} />
    </div>}
    {isPostAllowedType3Audio(post) && <T3AudioPlayer showEmbeddedPlayer={!!showEmbeddedPlayer} documentId={post._id} collectionName="Posts" />}
  </>;
}

export const PostsAudioPlayerWrapper = registerComponent('PostsAudioPlayerWrapper', PostsAudioPlayerWrapperInner, {styles});

declare global {
  interface ComponentTypes {
    PostsAudioPlayerWrapper: typeof PostsAudioPlayerWrapper
  }
}
