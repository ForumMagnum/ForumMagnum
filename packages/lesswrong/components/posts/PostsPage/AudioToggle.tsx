import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { postHasAudioPlayer } from './PostsAudioPlayerWrapper';
import LWTooltip from "../../common/LWTooltip";
import ForumIcon from "../../common/ForumIcon";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const podcastIconSize = (theme: ThemeType) => theme.isFriendlyUI ? 22 : 24;
// some padding around the icon to make it look like a stateful toggle button
const podcastIconPadding = (theme: ThemeType) => theme.isFriendlyUI ? 4 : 2

const styles = defineStyles("AudioToggle", (theme: ThemeType) => ({
  togglePodcastContainer: {
    alignSelf: 'center',
    color: theme.palette.text.dim3,
    height: podcastIconSize(theme),
  },
  audioIcon: {
    width: podcastIconSize(theme) + (podcastIconPadding(theme) * 2),
    height: podcastIconSize(theme) + (podcastIconPadding(theme) * 2),
    padding: podcastIconPadding(theme),
    transform: theme.isFriendlyUI ? undefined : `translateY(-${podcastIconPadding}px)`,
  },
  audioIconOn: {
    background: theme.palette.icon.dim05,
    borderRadius: theme.borderRadius.small
  },
  audioIconDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}));

const AudioToggle = ({post, toggleEmbeddedPlayer, showEmbeddedPlayer}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: (e: React.MouseEvent) => void,
  showEmbeddedPlayer?: boolean,
}) => {
  const classes = useStyles(styles);

  if (!postHasAudioPlayer(post)) {
    return null;
  }

  return <LWTooltip title={'Listen to this post'} className={classes.togglePodcastContainer}>
    <a href="#" onClick={(e: React.MouseEvent) => toggleEmbeddedPlayer?.(e)}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer})} />
    </a>
  </LWTooltip>
}

export default registerComponent('AudioToggle', AudioToggle, {styles});


