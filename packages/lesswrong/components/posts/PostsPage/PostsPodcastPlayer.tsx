import React from 'react';
import NoSSR from '@material-ui/core/NoSsr';
import { registerComponent } from '../../../lib/vulcan-lib';
import { applePodcastIcon } from '../../icons/ApplePodcastIcon';
import { spotifyPodcastIcon } from '../../icons/SpotifyPodcastIcon';
import { isClient } from '../../../lib/executionEnvironment';
import { useCurrentUser } from '../../common/withUser';
import { getThemeOptions } from '../../../themes/themeNames';
import { useCookies } from 'react-cookie';
import classNames from 'classnames';

const styles = (): JssStyles => ({
  embeddedPlayer: {
    marginBottom: '2px'
  },
  playerDarkMode: {
    opacity: 0.85
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

const PostsPodcastPlayer = ({ podcastEpisode, classes }: {
  podcastEpisode: PostsDetails_podcastEpisode,
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookies();
  const themeCookie = cookies['theme'];

  const themeOptions = getThemeOptions(themeCookie, currentUser);
  const isDarkMode = themeOptions.name === 'dark';

  /**
   * We need to embed a reference to the generated-per-episode buzzsprout script, which is responsible for hydrating the player div (with the id `buzzsprout-player-${externalEpisodeId}`).
   */
  const embedScriptFunction = (src: string, clientDocument: Document) => <>{
    ((doc) => {
      // First we check if such a script is already on the document.
      // That happens when navigating between posts, since the client doesn't render an entirely new page
      // In that case, we want to delete the previous one before adding the new one
      const playerScript = doc.getElementById('buzzsproutPlayerScript');
      if (playerScript) playerScript.parentNode?.removeChild(playerScript);
      const newScript = doc.createElement('script');
      newScript.async=true;
      newScript.src=src;
      newScript.id='buzzsproutPlayerScript';
      doc.head.appendChild(newScript);
    })(clientDocument)
  }</>;

  return <>
    <div
      id={`buzzsprout-player-${podcastEpisode.externalEpisodeId}`}
      className={classNames(classes.embeddedPlayer, { [classes.playerDarkMode]: isDarkMode })}
    />
    {isClient && <NoSSR>
      {embedScriptFunction(podcastEpisode.episodeLink, document)}
    </NoSSR>}
    <ul className={classes.podcastIconList}>
      {podcastEpisode.podcast.applePodcastLink && <li className={classes.podcastIcon}><a href={podcastEpisode.podcast.applePodcastLink}>{applePodcastIcon}</a></li>}
      {podcastEpisode.podcast.spotifyPodcastLink && <li className={classes.podcastIcon}><a href={podcastEpisode.podcast.spotifyPodcastLink}>{spotifyPodcastIcon}</a></li>}
    </ul>
  </>;
};

const PostsPodcastPlayerComponent = registerComponent('PostsPodcastPlayer', PostsPodcastPlayer, { styles });

declare global {
  interface ComponentTypes {
    PostsPodcastPlayer: typeof PostsPodcastPlayerComponent,
  }
}
