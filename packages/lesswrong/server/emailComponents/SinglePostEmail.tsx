import React from 'react';
import { postGetPageUrl, postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';
import './EmailFooterRecommendations';
import { isFriendlyUI } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  heading: {
    textAlign: "center",
    color: theme.palette.primary.main,
    marginBottom: 30
  },
  headingRow: {
    marginBottom: 8
  },

  podcastRow: {
    '& p': {
      marginBottom: 16,
    },
    fontStyle: "italic"
  },
  
  headingLink: {
    color: theme.palette.text.maxIntensity,
    textDecoration: "none",
    fontWeight: "normal",
    fontFamily: theme.typography.headerStyle.fontFamily,
    ...(isFriendlyUI ? {
      fontSize: "2.4rem",
      lineHeight: '1.25em'
    } : {}),
  },
  
  headingHR: {
    width: 210,
    height: 0,
    borderTop: "none",
    borderBottom: theme.palette.border.emailHR,
    marginTop: 50,
    marginBottom: 35,
  },
  hr: {
    marginTop: 30,
    marginBottom: 30,
  },
});

const getPodcastInfoElement = (podcastEpisode: PostsDetails_podcastEpisode) => {
  const { podcast: { applePodcastLink, spotifyPodcastLink }, episodeLink, externalEpisodeId } = podcastEpisode;
  const episodeUrl = new URL(episodeLink);

  // episodeLink is something like https://www.buzzsprout.com/2037297/11391281-...
  // But they can also have multiple forward slashes between the origin and the podcast ID
  // Therefore, the first element returned by `episodeUrl.pathname.split('/').filter(pathSection => !!pathSection)` is `2037297`
  const [buzzsproutPodcastId] = episodeUrl.pathname.split('/').filter(pathSection => !!pathSection);
  const buzzsproutEpisodePath = `${buzzsproutPodcastId}/${externalEpisodeId}`;

  const directEpisodeUrl = new URL(episodeUrl.origin);
  directEpisodeUrl.pathname = buzzsproutEpisodePath;

  const buzzsproutLinkElement = <a href={directEpisodeUrl.toString()}>Buzzsprout</a>
  const spotifyLinkElement = spotifyPodcastLink ? <a href={spotifyPodcastLink}>Spotify</a> : undefined;
  const appleLinkElement = applePodcastLink ? <a href={applePodcastLink}>Apple Podcasts</a> : undefined;

  const externalDirectoryAvailability = !!spotifyLinkElement && !!appleLinkElement;

  return <p>
    Listen to the podcast version of this post on {buzzsproutLinkElement}.
    {externalDirectoryAvailability ? <>  You can also find it on {spotifyLinkElement} and {appleLinkElement}.</> : <></>}
  </p>;
};

const SinglePostEmail = ({documentId, reason, hideRecommendations, classes}: {
  documentId: string,
  reason?: string,
  hideRecommendations?: boolean,
  classes: any,
}) => {
  const { document } = useSingle({
    documentId,
    
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
  const { EmailPostAuthors, EmailContentItemBody, EmailPostDate, EmailFooterRecommendations, ContentStyles } = Components;
  if (!document) return null;
  
  // event location - for online events, attempt to show the meeting link
  let eventLocation: string|JSX.Element = document.location
  if (document.onlineEvent) {
    eventLocation = document.joinEventLink ? <a
      className={classes.onlineEventLocation}
      href={document.joinEventLink}
      target="_blank" rel="noopener noreferrer">
        {document.joinEventLink}
    </a> : "Online Event"
  }

  return (<React.Fragment>
    <div className={classes.heading}>
      <h1>
        <a href={postGetPageUrl(document, true)} className={classes.headingLink}>{document.title}</a>
      </h1>
      
      <hr className={classes.headingHR}/>
      
      <div className={classes.headingRow}>
        <EmailPostAuthors post={document}/>
      </div>
      <div className={classes.headingRow}>
        <EmailPostDate post={document}/>
      </div>
      {document.isEvent && <div className={classes.headingRow}>
        {eventLocation}
      </div>}
      {document.contactInfo && <div className={classes.headingRow}>
        Contact: {document.contactInfo}
      </div>}
      
      {document.url && <div className={classes.headingRow}>
        This is a linkpost for <a href={postGetLink(document)} target={postGetLinkTarget(document)}>{document.url}</a>
      </div>}
    </div>

    {document.podcastEpisode && <div className={classes.podcastRow}>
      {getPodcastInfoElement(document.podcastEpisode)}
      <hr />
    </div>}
    
    {document.contents && <ContentStyles contentType="post">
      <EmailContentItemBody className="post-body" dangerouslySetInnerHTML={{
        __html: document.contents.html
      }} />
    </ContentStyles>}
    
    <a href={postGetPageUrl(document, true)}>Discuss</a>
    
    {!hideRecommendations && (
      <>
        <hr className={classes.hr}/>
        <EmailFooterRecommendations />
      </>
    )}
    
    <hr className={classes.hr}/>
    
    {reason && `You are receiving this email because ${reason}.`}
  </React.Fragment>);
}

const SinglePostEmailComponent = registerComponent("SinglePostEmail", SinglePostEmail, {styles});

declare global {
  interface ComponentTypes {
    SinglePostEmail: typeof SinglePostEmailComponent
  }
}
