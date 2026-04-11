import React, { useEffect, useRef } from 'react';
import { applePodcastIcon } from '../../icons/ApplePodcastIcon';
import { spotifyPodcastIcon } from '../../icons/SpotifyPodcastIcon';
import { useEventListener } from '../../hooks/useEventListener';
import { useTracking } from '../../../lib/analyticsEvents';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsPodcastPlayer', (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: '2px',
    opacity: theme.dark ? 0.85 : 1,
  },
  podcastIconList: {
    paddingLeft: '0px',
    marginTop: '0px'
  },
  podcastIcon: {
    display: 'inline-block',
    marginRight: '8px'
  }
}));

const PostsPodcastPlayer = ({podcastEpisode, postId, hideIconList = false}: {
  podcastEpisode: Exclude<PostPodcastEpisode['podcastEpisode'], null>,
  postId: string,
  hideIconList?: boolean,
}) => {
  const classes = useStyles(styles);
  const mouseOverDiv = useRef(false);
  const divRef = useRef<HTMLDivElement | null>(null);
  const { captureEvent } = useTracking();

  // Embed a reference to the generated-per-episode buzzsprout script, which is
  // responsible for hydrating the player div (with the id
  // `buzzsprout-player-${externalEpisodeId}`).
  //
  // Many legacy `episodeLink`s in the DB (the 349 Rationality: A to Z
  // episodes imported by `2022-08-19-createPodcastsForPosts`) are stored with
  // two malformations that now cause the buzzsprout CDN to 404:
  //   1. A spurious double slash after the domain (`buzzsprout.com//2036194/...`)
  //   2. The query-string separator HTML-entity-encoded as `&amp;` instead of `&`,
  //      which buzzsprout's router treats as a single `amp;player` param and
  //      then refuses to serve the script.
  // Both issues make `<script src>` loads silently fail, so clicking the
  // speaker icon brings up an empty, unhydrated player. Sanitize the URL
  // before use so existing rows keep working without a data migration.
  useEffect(() => {
    let sanitizedLink = podcastEpisode.episodeLink;
    try {
      const parsed = new URL(podcastEpisode.episodeLink.replace(/&amp;/g, '&'));
      parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
      sanitizedLink = parsed.toString();
    } catch {
      // If the stored URL can't be parsed, fall through to the raw value;
      // failing loudly here would just break the player for no gain.
    }

    const newScript = document.createElement('script');
    newScript.async=true;
    newScript.src=sanitizedLink;
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

export default PostsPodcastPlayer


