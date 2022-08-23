import React from 'react';
import NoSSR from '@material-ui/core/NoSsr';
import { registerComponent } from '../../../lib/vulcan-lib';
import { applePodcastIcon } from '../../icons/ApplePodcastIcon';
import { spotifyPodcastIcon } from '../../icons/SpotifyPodcastIcon';
import { isClient } from '../../../lib/executionEnvironment';

const styles = (): JssStyles => ({
  embeddedPlayer: {
    marginBottom: '2px'
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
  podcastEpisode: PostsBase_podcastEpisode,
  classes: ClassesType
}) => {
  const embedScriptFunction = (src: string, clientWindow: Window & typeof globalThis, clientDocument: Document) => <script>{
    function(p,l,a,y,s?: HTMLScriptElement) {
      if(p[a]) return;
      if(p[y]) return p[y]();
      s=l.createElement('script');
      l.head.appendChild((
        s.async=p[a]=true,
        s.src=src,
        s
      ));
    }(clientWindow,clientDocument,'__btL','__btR')
  }</script>;

  return <>
    {isClient && <NoSSR>
      <div
        id={`buzzsprout-player-${podcastEpisode.externalEpisodeId}`}
        className={classes.embeddedPlayer}
      />
      {embedScriptFunction(podcastEpisode.episodeLink, window, document)}
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
