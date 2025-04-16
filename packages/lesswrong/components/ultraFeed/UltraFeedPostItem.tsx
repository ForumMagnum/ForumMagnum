import React, { useState, useCallback, useRef, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetLink, postGetKarma } from "@/lib/collections/posts/helpers";
import { FeedPostMetaInfo } from "./ultraFeedTypes";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { usePostsUserAndCoauthors } from "../posts/usePostsUserAndCoauthors";

const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    paddingTop: 12,
    paddingLeft: 16,
    paddingRight: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 4,
  },
  titleContainer: {
    flexGrow: 1,
    paddingRight: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.6rem',
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
    },
  },
  headerRightSection: {
    display: "flex",
    flexGrow: 0,
  },
  tripleDotMenu: {
    padding: 5,
    marginLeft: 4,
    marginRight: -10,
    "& svg": {
      fontSize: "1.4rem",
      cursor: "pointer",
      color: theme.palette.text.dim,
    }
  },
  metaRoot: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: "6px",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.3rem",
    "& > *": {
      marginRight: 5,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  metaLeftSection: {
    display: "flex",
    alignItems: "center",
    flex: "1 1 auto",
    flexWrap: "wrap",
  },
  metaRightSection: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
    marginRight: 0,
  },
  metaKarma: {
    display: "inline-block",
    textAlign: "center",
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: 8,
    marginRight: 4,
  },
  metaUsername: {
    marginRight: 12,
    '& a, & a:hover': {
      color: theme.palette.link.unmarked,
    },
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
  metaCoauthors: {
    marginLeft: 4,
    marginRight: 0,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
  },
  metaDateContainer: {
    marginRight: 8,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 12,
  },
}));

// TODO: This is optimized for mobile (only show one author, might want to show more on desktop)
const PostAuthorsDisplay = ({ authors, isAnon }: { authors: UsersMinimumInfo[]; isAnon: boolean }) => {
  const classes = useStyles(styles);
  const { UserNameDeleted, UsersName } = Components;

  if (isAnon || authors.length === 0) {
    return <UserNameDeleted />;
  }

  const mainAuthor = authors[0];
  const additionalAuthorsCount = authors.length - 1;

  return (
    <span className={classes.metaUsername}>
      <UsersName user={mainAuthor} />
      {additionalAuthorsCount > 0 && (
        <span className={classes.metaCoauthors}>+{additionalAuthorsCount}</span>
      )}
    </span>
  );
};

const UltraFeedPostItem = ({
  post,
  postMetaInfo,
  index,
  showKarma,
  settings = DEFAULT_SETTINGS,
}: {
  post: PostsListWithVotes,
  postMetaInfo: FeedPostMetaInfo,
  index: number,
  showKarma?: boolean,
  settings?: UltraFeedSettingsType,
}) => {
  const classes = useStyles(styles);
  const { PostActionsButton, FeedContentBody, UltraFeedItemFooter, FormatDate } = Components;
  const { observe, trackExpansion } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { captureEvent } = useTracking();
  const { isAnon, authors } = usePostsUserAndCoauthors(post);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, { documentId: post._id, documentType: 'post' });
    }
  }, [observe, post._id]);

  const handleContentExpand = useCallback((level: number, maxReached: boolean, wordCount: number) => {
    trackExpansion({
      documentId: post._id,
      documentType: 'post',
      level,
      maxLevelReached: maxReached,
      wordCount,
    });

    captureEvent("ultraFeedPostItemExpanded", {
      postId: post._id,
      level,
      maxLevelReached: maxReached,
      wordCount,
    });
  }, [trackExpansion, post._id, captureEvent]);

  return (
    <AnalyticsContext ultraFeedElementType="feedPost" postId={post._id} ultraFeedCardIndex={index}>
    <div ref={elementRef} className={classes.root}>
      <div className={classes.header}>
        <div className={classes.titleRow}>
          <div className={classes.titleContainer}>
            <Link to={postGetLink(post)} className={classes.title}>{post.title}</Link>
          </div>
          <span className={classes.headerRightSection}>
            <AnalyticsContext pageElementContext="tripleDotMenu">
              <PostActionsButton
                post={post}
                vertical={true}
                className={classes.tripleDotMenu}
              />
            </AnalyticsContext>
          </span>
        </div>
        <div className={classes.metaRoot}>
          <span className={classes.metaLeftSection}>
            {showKarma && !post.rejected && <span className={classes.metaKarma}>
              {postGetKarma(post)}
            </span>}
            <PostAuthorsDisplay authors={authors} isAnon={isAnon} />
            {post.postedAt && (
              <span className={classes.metaDateContainer}>
                <FormatDate date={post.postedAt} />
              </span>
            )}
          </span>
        </div>
      </div>

      {post.contents && (
        <FeedContentBody
          post={post}
          html={post.contents.htmlHighlight ?? ""}
          breakpoints={settings.postTruncationBreakpoints}
          initialExpansionLevel={0}
          wordCount={post.contents.wordCount ?? 0}
          linkToDocumentOnFinalExpand={true}
          nofollow={(post.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
          onExpand={handleContentExpand}
        />
      )}
      <UltraFeedItemFooter document={post} collectionName="Posts" metaInfo={postMetaInfo} className={classes.footer} />
    </div>
    </AnalyticsContext>
  );
};

const UltraFeedPostItemComponent = registerComponent("UltraFeedPostItem", UltraFeedPostItem);

export default UltraFeedPostItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedPostItem: typeof UltraFeedPostItemComponent
  }
} 
