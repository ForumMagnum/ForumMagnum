import React, { useEffect, useMemo } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useCookiesWithConsent } from '@/components/hooks/useCookiesWithConsent';
import moment from 'moment';
import { PODCAST_TOOLTIP_SEEN_COOKIE } from '@/lib/cookies/cookies';
import classNames from 'classnames';
import { isLWorAF } from '@/lib/instanceSettings';
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
    transform: `translateY(-${PODCAST_ICON_PADDING}px)`,
    padding: PODCAST_ICON_PADDING
  },
  audioNewFeaturePulse: {
    top: PODCAST_ICON_PADDING * 1.5
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
  const { LWTooltip, NewFeaturePulse, ForumIcon } = Components;

  const [cookies, setCookie] = useCookiesWithConsent([PODCAST_TOOLTIP_SEEN_COOKIE]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cachedTooltipSeen = useMemo(() => cookies[PODCAST_TOOLTIP_SEEN_COOKIE], []);

  useEffect(() => {
    if(!cachedTooltipSeen) {
      setCookie(PODCAST_TOOLTIP_SEEN_COOKIE, true, {
        expires: moment().add(2, 'years').toDate(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const audioIcon = <LWTooltip title={'Listen to this post'} className={classes.togglePodcastContainer}>
    <a href="#" onClick={toggleEmbeddedPlayer}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer, [classes.audioIconDisabled]: !toggleEmbeddedPlayer})} />
    </a>
  </LWTooltip>

  if (!postHasAudioPlayer(post)) {
    return null;
  }

  if (cachedTooltipSeen || isLWorAF) {
    return audioIcon
  }
  return (
    <NewFeaturePulse className={classes.audioNewFeaturePulse}>
      {audioIcon}
    </NewFeaturePulse>
  )
}

const AudioToggleComponent = registerComponent('AudioToggle', AudioToggle, {styles});

declare global {
  interface ComponentTypes {
    AudioToggle: typeof AudioToggleComponent
  }
}
