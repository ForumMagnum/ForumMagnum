import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { useMulti } from '@/lib/crud/withMulti';
import { isFriendlyUI } from '@/themes/forumTheme';
import { postGetPageUrl, postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { truncatise } from '@/lib/truncatise';
import { SMALL_TRUNCATION_CHAR_COUNT } from '@/lib/editor/ellipsize';
import { LocationContext, NavigationContext } from '@/lib/vulcan-core/appContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { EmailPostAuthors } from './EmailPostAuthors';
import { EmailContentItemBody } from './EmailContentItemBody';
import { EmailFooterRecommendations } from './EmailFooterRecommendations';
import { EmailPostDate } from './EmailPostDate';

const getPodcastInfoElement = (podcastEpisode: PostsDetails_podcastEpisode) => {
  const { podcast: { applePodcastLink, spotifyPodcastLink }, episodeLink, externalEpisodeId } = podcastEpisode;
  const episodeUrl = new URL(episodeLink);

  const [buzzsproutPodcastId] = episodeUrl.pathname.split('/').filter(pathSection => !!pathSection);
  const buzzsproutEpisodePath = `${buzzsproutPodcastId}/${externalEpisodeId}`;

  const directEpisodeUrl = new URL(episodeUrl.origin);
  directEpisodeUrl.pathname = buzzsproutEpisodePath;

  const buzzsproutLinkElement = <a href={directEpisodeUrl.toString()}>Buzzsprout</a>
  const spotifyLinkElement = spotifyPodcastLink ? <a href={spotifyPodcastLink}>Spotify</a> : undefined;
  const appleLinkElement = applePodcastLink ? <a href={applePodcastLink}>Apple Podcasts</a> : undefined;

  const externalDirectoryAvailability = !!spotifyLinkElement && !!appleLinkElement;

  return (
    <p>
      Listen to the podcast version of this post on {buzzsproutLinkElement}.
      {externalDirectoryAvailability ? <>  You can also find it on {spotifyLinkElement} and {appleLinkElement}.</> : <></>}
    </p>
  );
};

const getTruncatedHtml = (html: string) => {
  const styles = html ? (html.match(/<style[\s\S]*?<\/style>/g) || "") : "";
  const htmlWithoutStyles = html ? html.replace(/<style[\s\S]*?<\/style>/g, '') : '';

  const truncatedByParagraphs = truncatise(htmlWithoutStyles, {
    TruncateLength: 2,
    TruncateBy: "paragraphs",
    Suffix: `...`,
  });

  const truncatedByHalfSmallCharCount = truncatise(htmlWithoutStyles, {
    TruncateLength: SMALL_TRUNCATION_CHAR_COUNT * 0.5,
    TruncateBy: "characters",
    Suffix: `...`,
  });

  const truncatedByOneAndHalfSmallCharCount = truncatise(htmlWithoutStyles, {
    TruncateLength: SMALL_TRUNCATION_CHAR_COUNT * 1.5,
    TruncateBy: "characters",
    Suffix: `...`,
  });

  if (
    truncatedByParagraphs.length >= truncatedByHalfSmallCharCount.length &&
    truncatedByParagraphs.length <= truncatedByOneAndHalfSmallCharCount.length
  ) {
    return `${truncatedByParagraphs}${styles}`;
  } else {
    return truncatise(htmlWithoutStyles, {
      TruncateLength: SMALL_TRUNCATION_CHAR_COUNT,
      TruncateBy: "characters",
      Suffix: `...${styles}`,
    });
  }
};

const styles = defineStyles("PostsEmail", (theme: ThemeType) => ({
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
}));

function PostsEmailInner({
  postIds,
  reason,
  hideRecommendations,
}: {
  postIds: string[];
  reason?: string;
  hideRecommendations?: boolean;
}) {
  const classes = useStyles(styles);
  const { results: posts } = useMulti({
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    terms: { postIds },
  });

  const { ContentStyles } = Components;

  if (!posts || posts.length === 0) {
    return null;
  }

  // Reusable piece to render each post. We take a "truncated" boolean flag:
  const renderPost = ({ post, truncated }: { post: PostsRevision; truncated: boolean; }) => {
    let eventLocation: string | JSX.Element = post.location;
    if (post.onlineEvent) {
      eventLocation = post.joinEventLink ? (
        <a href={post.joinEventLink} target="_blank" rel="noopener noreferrer">
          {post.joinEventLink}
        </a>
      ) : (
        "Online Event"
      );
    }
    const fullHtml: string = post.contents?.html || "";
    const postContentHtml = truncated ? getTruncatedHtml(fullHtml) : fullHtml;

    return (
      <React.Fragment key={post._id}>
        <div className={classes.heading}>
          <h1>
            <a href={postGetPageUrl(post, true)} className={classes.headingLink}>
              {post.title}
            </a>
          </h1>
          <hr className={classes.headingHR} />
          <div className={classes.headingRow}>
            <EmailPostAuthors post={post} />
          </div>
          <div className={classes.headingRow}>
            <EmailPostDate post={post} />
          </div>
          {post.isEvent && <div className={classes.headingRow}>{eventLocation}</div>}
          {post.contactInfo && (
            <div className={classes.headingRow}>Contact: {post.contactInfo}</div>
          )}
          {post.url && (
            <div className={classes.headingRow}>
              This is a linkpost for{" "}
              <a href={postGetLink(post)} target={postGetLinkTarget(post)}>
                {post.url}
              </a>
            </div>
          )}
        </div>

        {post.podcastEpisode && (
          <div className={classes.podcastRow}>
            {getPodcastInfoElement(post.podcastEpisode)}
            <hr />
          </div>
        )}

        {post.contents && (
          <ContentStyles contentType="post">
            <EmailContentItemBody
              className="post-body"
              dangerouslySetInnerHTML={{
                __html: postContentHtml,
              }}
            />
          </ContentStyles>
        )}

        <a href={postGetPageUrl(post, true)}>{truncated ? "Read full post" : "Discuss"}</a>
        <hr className={classes.hr} />
      </React.Fragment>
    );
  };

  const single = posts.length === 1;
  const postElements = posts.map((post) => renderPost({ post, truncated: !single }));

  return (
    <>
      {postElements}
      {!hideRecommendations && (
        <>
          <EmailFooterRecommendations />
          <hr className={classes.hr}/>
        </>
      )}
      {reason && `You are receiving this email because ${reason}.`}
    </>
  );
}

export const PostsEmail = ({ postIds, reason, hideRecommendations}: {
  postIds: string[];
  reason?: string;
  hideRecommendations?: boolean;
}) => {
  const classes = useStyles(styles);
  return (
    // Providers are required for useMulti
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
        <PostsEmailInner
          postIds={postIds}
          reason={reason}
          hideRecommendations={hideRecommendations}
        />
      </NavigationContext.Provider>
    </LocationContext.Provider>
  );
};
