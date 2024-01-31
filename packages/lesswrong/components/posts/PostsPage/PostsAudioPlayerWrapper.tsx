// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import classNames from 'classnames';
import { T3AudioPlayer } from './T3AudioPlayer';
import { isPostAllowedType3Audio } from '../../../lib/collections/posts/helpers';

const styles = (theme: ThemeType) => ({
  root: {

  },
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
});

export const postHasAudioPlayer = (post: PostsWithNavigation|PostsWithNavigationAndRevision) => {
  return post.podcastEpisode || isPostAllowedType3Audio(post);
}

export const PostsAudioPlayerWrapper = ({post, showEmbeddedPlayer, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  showEmbeddedPlayer: boolean,
  classes: ClassesType<typeof styles>,
}) => {

  const { PostsPodcastPlayer, T3AudioPlayer } = Components;

  return <>
        {post.podcastEpisode && <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
          <PostsPodcastPlayer podcastEpisode={post.podcastEpisode} postId={post._id} />
        </div>}
        {isPostAllowedType3Audio(post) && <T3AudioPlayer showEmbeddedPlayer={!!showEmbeddedPlayer} postId={post._id}/>}

  </>;
}

const PostsAudioPlayerWrapperComponent = registerComponent('PostsAudioPlayerWrapper', PostsAudioPlayerWrapper, {styles});

declare global {
  interface ComponentTypes {
    PostsAudioPlayerWrapper: typeof PostsAudioPlayerWrapperComponent
  }
}
