import React, { useEffect, useRef } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { applePodcastIcon } from '../../icons/ApplePodcastIcon';
import { spotifyPodcastIcon } from '../../icons/SpotifyPodcastIcon';
import { useEventListener } from '../../hooks/useEventListener';
import { useTracking } from '../../../lib/analyticsEvents';

const styles = (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: '2px',
    opacity: theme.palette.embeddedPlayer.opacity,
  },
  podcastIconList: {
    paddingLeft: '0px',
    marginTop: '0px'
  },
  podcastIcon: {
    display: 'inline-block',
    marginRight: '8px'
  }
});

const PostsPodcastPlayer = ({ podcastEpisode, postId, hideIconList = false, classes }: {
  podcastEpisode: Exclude<PostsDetails['podcastEpisode'], null>,
  postId: string,
  hideIconList?: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const mouseOverDiv = useRef(false);
  const divRef = useRef<HTMLDivElement | null>(null);
  const { captureEvent } = useTracking();

  // Embed a reference to the generated-per-episode buzzsprout script, which is
  // responsible for hydrating the player div (with the id
  // `buzzsprout-player-${externalEpisodeId}`).
  useEffect(() => {
    const newScript = document.createElement('script');
    newScript.async=true;
    newScript.src=podcastEpisode.episodeLink;
    document.head.appendChild(newScript);
    
    return () => {
      newScript.parentNode?.removeChild(newScript);
    }
  }, [podcastEpisode.episodeLink]);

  const setMouseOverDiv = (isMouseOver: boolean) => {
    mouseOverDiv.current = isMouseOver;
  };

  // Dumb hack to let us figure out when the iframe inside the div was clicked on, as a (fuzzy) proxy for people clicking the play button
  // Inspiration: https://gist.github.com/jaydson/1780598
  // This won't trigger more than once per page load, unless the user clicks outside the div element, which will reset it
  useEventListener('blur', (e) => {
    if (mouseOverDiv.current) {
      captureEvent('clickInsidePodcastPlayer', { postId, externalEpisodeId: podcastEpisode.externalEpisodeId, playerType: "buzzSprout" });
    }
  });

  return <>
    <div
      id={`buzzsprout-player-${podcastEpisode.externalEpisodeId}`}
      className={classes.embeddedPlayer}
      ref={divRef}
      onMouseOver={() => setMouseOverDiv(true)}
      onMouseOut={() => setMouseOverDiv(false)}
    />
    {!hideIconList && <ul className={classes.podcastIconList}>
      {podcastEpisode.podcast.applePodcastLink && <li className={classes.podcastIcon}><a href={podcastEpisode.podcast.applePodcastLink}>{applePodcastIcon}</a></li>}
      {podcastEpisode.podcast.spotifyPodcastLink && <li className={classes.podcastIcon}><a href={podcastEpisode.podcast.spotifyPodcastLink}>{spotifyPodcastIcon}</a></li>}
    </ul>}
  </>;
};

export default registerComponent('PostsPodcastPlayer', PostsPodcastPlayer, { styles });


