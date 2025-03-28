import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isFriendlyUI } from '@/themes/forumTheme';
import { postHasAudioPlayer } from './PostsAudioPlayerWrapper';

const PODCAST_ICON_SIZE = isFriendlyUI ? 22 : 24;
// some padding around the icon to make it look like a stateful toggle button
const PODCAST_ICON_PADDING = isFriendlyUI ? 4 : 2

const styles = (theme: ThemeType) => ({
  togglePodcastContainer: {
    alignSelf: 'center',
    color: theme.palette.text.dim3,
    height: PODCAST_ICON_SIZE,
  },
  audioIcon: {
    width: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2),
    height: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2),
    padding: PODCAST_ICON_PADDING,
    transform: isFriendlyUI ? undefined : `translateY(-${PODCAST_ICON_PADDING}px)`,
  },
  audioIconOn: {
    background: theme.palette.icon.dim05,
    borderRadius: theme.borderRadius.small
  },
  audioIconDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
});

const AudioToggle = ({classes, post, toggleEmbeddedPlayer, showEmbeddedPlayer}: {
  classes: ClassesType<typeof styles>,
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: () => void,
  showEmbeddedPlayer?: boolean,
}) => {
  const { LWTooltip, ForumIcon } = Components;

  if (!postHasAudioPlayer(post)) {
    return null;
  }

  return <LWTooltip title={'Listen to this post'} className={classes.togglePodcastContainer}>
    <a href="#" onClick={toggleEmbeddedPlayer}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer})} />
    </a>
  </LWTooltip>
}

const AudioToggleComponent = registerComponent('AudioToggle', AudioToggle, {styles});

declare global {
  interface ComponentTypes {
    AudioToggle: typeof AudioToggleComponent
  }
}
