import { postGetPageUrl, postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';
import './EmailFooterRecommendations';
import { isFriendlyUI } from '@/themes/forumTheme';
import { LocationContext, NavigationContext } from '@/lib/vulcan-core/appContext';
import { useMulti } from '@/lib/crud/withMulti';
import React from 'react';
import { truncatise } from '@/lib/truncatise';
import { SMALL_TRUNCATION_CHAR_COUNT } from '@/lib/editor/ellipsize';

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

// TODO combine better with SinglePostEmail
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

const getTruncatedHtml = (html: string) => {
  const styles = html ? (html.match(/<style[\s\S]*?<\/style>/g) || "") : "";
  const htmlRemovedStyles = html ? html.replace(/<style[\s\S]*?<\/style>/g, '') : '';

  const truncatedByParagraphs = truncatise(htmlRemovedStyles, {
    TruncateLength: 2,
    TruncateBy: "paragraphs",
    Suffix: `...`,
  });

  const truncatedByHalfSmallCharCount = truncatise(htmlRemovedStyles, {
    TruncateLength: SMALL_TRUNCATION_CHAR_COUNT * 0.5,
    TruncateBy: "characters",
    Suffix: `...`,
  });

  const truncatedByOneAndHalfSmallCharCount = truncatise(htmlRemovedStyles, {
    TruncateLength: SMALL_TRUNCATION_CHAR_COUNT * 1.5,
    TruncateBy: "characters",
    Suffix: `...`,
  });

  if (truncatedByParagraphs.length >= truncatedByHalfSmallCharCount.length && truncatedByParagraphs.length <= truncatedByOneAndHalfSmallCharCount.length) {
    return `${truncatedByParagraphs}${styles}`;
  } else {
    return truncatise(htmlRemovedStyles, {
      TruncateLength: SMALL_TRUNCATION_CHAR_COUNT,
      TruncateBy: "characters",
      Suffix: `...${styles}`,
    });;
  }
};

const MultiPostEmailInner = ({ postIds, reason, hideRecommendations, classes }: {
  postIds: string[],
  reason?: string,
  hideRecommendations?: boolean,
  classes: any,
}) => {
  const { results: posts } = useMulti({
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    terms: {
      postIds
    },
  });

  const { EmailPostAuthors, EmailContentItemBody, EmailPostDate, ContentStyles, EmailFooterRecommendations } = Components;

  if (!posts || posts.length === 0) return null;

  const postElements = posts.map(document => {
    // event location - for online events, attempt to show the meeting link
    let eventLocation: string | JSX.Element = document.location;
    if (document.onlineEvent) {
      eventLocation = document.joinEventLink ? <a
        className={classes.onlineEventLocation}
        href={document.joinEventLink}
        target="_blank" rel="noopener noreferrer">
          {document.joinEventLink}
      </a> : "Online Event";
    }
    const html = document.contents?.html;

    const truncatedContent = html ? getTruncatedHtml(html) : '';

    return (
      <>
        <div key={document._id} className={classes.heading}>
          <h1>
            <a href={postGetPageUrl(document, true)} className={classes.headingLink}>
              {document.title}
            </a>
          </h1>

          <hr className={classes.headingHR} />

          <div className={classes.headingRow}>
            <EmailPostAuthors post={document} />
          </div>
          <div className={classes.headingRow}>
            <EmailPostDate post={document} />
          </div>
          {document.isEvent && <div className={classes.headingRow}>{eventLocation}</div>}
          {document.contactInfo && <div className={classes.headingRow}>Contact: {document.contactInfo}</div>}

          {document.url && (
            <div className={classes.headingRow}>
              This is a linkpost for{" "}
              <a href={postGetLink(document)} target={postGetLinkTarget(document)}>
                {document.url}
              </a>
            </div>
          )}
        </div>

        {document.podcastEpisode && (
          <div className={classes.podcastRow}>
            {getPodcastInfoElement(document.podcastEpisode)}
            <hr />
          </div>
        )}

        {document.contents && (
          <ContentStyles contentType="post">
            <EmailContentItemBody
              className="post-body"
              dangerouslySetInnerHTML={{
                __html: truncatedContent,
              }}
            />
          </ContentStyles>
        )}

        <a href={postGetPageUrl(document, true)}>Read full post</a>

        <hr className={classes.hr} />
      </>
    );
  });

  return (
    <>
      {postElements}
      {!hideRecommendations && (
        <>
          <EmailFooterRecommendations />
        </>
      )}
      {reason && `You are receiving this email because ${reason}.`}
    </>
  );
};

// TODO clean up the providers here
const MultiPostEmail = ({ postIds, reason, hideRecommendations, classes }: {
  postIds: string[],
  reason?: string,
  hideRecommendations?: boolean,
  classes: any,
}) => {
  return (
    <LocationContext.Provider
      value={{
        currentRoute: null,
        RouteComponent: null,
        location: { pathname: "", search: "", hash: "" },
        pathname: "",
        url: "",
        hash: "",
        params: {},
        query: {},
        redirected: false,
      }}
    >
      <NavigationContext.Provider
        value={{
          history: {
            length: 0,
            action: "PUSH",
            location: { pathname: "", search: "", hash: "", state: undefined },
            push: () => {},
            replace: () => {},
            go: () => {},
            goBack: () => {},
            goForward: () => {},
            block: () => () => {},
            listen: () => () => {},
            createHref: () => "",
          },
        }}
      >
        <MultiPostEmailInner
          postIds={postIds}
          reason={reason}
          hideRecommendations={hideRecommendations}
          classes={classes}
        />
      </NavigationContext.Provider>
    </LocationContext.Provider>
  );
}

const MultiPostEmailComponent = registerComponent("MultiPostEmail", MultiPostEmail, {styles});

declare global {
  interface ComponentTypes {
    MultiPostEmail: typeof MultiPostEmailComponent
  }
}
