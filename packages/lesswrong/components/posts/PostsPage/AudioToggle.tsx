import React from 'react';
import classNames from 'classnames';
import LWTooltip from "../../common/LWTooltip";
import ForumIcon from "../../common/ForumIcon";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const podcastIconSize = (theme: ThemeType) => 24;
// some padding around the icon to make it look like a stateful toggle button
const podcastIconPadding = (theme: ThemeType) => 2

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
    transform: `translateY(-${podcastIconPadding(theme)}px)`,
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

/**
 * The button that shows and hides a post's audio player. Whoever renders the
 * player knows whether there is one, and passes `toggleEmbeddedPlayer` only if
 * so: without it there's no button.
 */
const AudioToggle = ({toggleEmbeddedPlayer, showEmbeddedPlayer}: {
  toggleEmbeddedPlayer?: (e: React.MouseEvent) => void,
  showEmbeddedPlayer?: boolean,
}) => {
  const classes = useStyles(styles);

  if (!toggleEmbeddedPlayer) {
    return null;
  }

  return <LWTooltip title={'Listen to this post'} className={classes.togglePodcastContainer}>
    <a href="#" onClick={toggleEmbeddedPlayer}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer})} />
    </a>
  </LWTooltip>
}

export default AudioToggle


