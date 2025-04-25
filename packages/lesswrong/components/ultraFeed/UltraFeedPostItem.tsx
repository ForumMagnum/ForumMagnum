import React, { useState, useCallback, useRef, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { postGetLink, postGetKarma } from "@/lib/collections/posts/helpers";
import { FeedPostMetaInfo } from "./ultraFeedTypes";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { useRecordPostView } from "../hooks/useRecordPostView";
import classnames from "classnames";
import { useSingle } from "../../lib/crud/withSingle";
import { highlightMaxChars } from "../../lib/editor/ellipsize";
import { useOverflowNav } from "./OverflowNavObserverContext";
import { useDialog } from "../common/withDialog";
import { isPostWithForeignId } from "../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";

const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    position: 'relative',
    padding: '12px 16px',
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
  },
  tripleDotMenu: {
    opacity: 0.7,
    position: 'absolute',
    right: 2,
    top: 5,
    padding: 5,
    marginLeft: 4,
    "& svg": {
      fontSize: 18,
      cursor: "pointer",
      color: theme.palette.text.dim,
    }
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
    },
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    flexGrow: 1,
    paddingRight: 8,
    [theme.breakpoints.down('sm')]: {
      fontSize: 20.5,
    },
  },
  titleIsRead: {
    opacity: 0.5,
    '&:hover': {
      opacity: 0.9,
    },
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    rowGap: "6px",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      fontSize: "1.3rem",
    },
  },
  metaDateContainer: {
    marginRight: 8,
  },
  footer: {
    paddingTop: 12,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  },
  authorsList: {
    fontSize: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
    marginRight: 8,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
}));

interface UltraFeedPostItemHeaderProps {
  post: PostsListWithVotes;
  isRead: boolean;
  handleOpenDialog: (params?: { textFragment?: string }) => void;
}

const UltraFeedPostItemHeader = ({
  post,
  isRead,
  handleOpenDialog,
}: UltraFeedPostItemHeaderProps) => {
  const { TruncatedAuthorsList, FormatDate } = Components;

  const classes = useStyles(styles);
  const authorListRef = useRef<HTMLDivElement>(null);

  return (
    <div className={classes.header}>
      <div className={classes.titleContainer}>
        <span
          onClick={() => handleOpenDialog()}
          className={classnames(classes.title, { [classes.titleIsRead]: isRead })}
          role="button"
          tabIndex={0}
        >
          {post.title}
        </span>
      </div>
      <div className={classes.metaRow}>
        <TruncatedAuthorsList post={post} useMoreSuffix={false} expandContainer={authorListRef} className={classes.authorsList} />
        {post.postedAt && (
          <span className={classes.metaDateContainer}>
            <FormatDate date={post.postedAt} />
          </span>
        )}
      </div>
    </div>
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
  const { PostActionsButton, FeedContentBody, UltraFeedItemFooter, FormatDate, Loading, TruncatedAuthorsList, OverflowNavButtons } = Components;

  const { observe, trackExpansion } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { openDialog } = useDialog();
  const overflowNav = useOverflowNav(elementRef);
  const { captureEvent } = useTracking();
  const { recordPostView, isRead } = useRecordPostView(post);
  const [hasRecordedViewOnExpand, setHasRecordedViewOnExpand] = useState(false);
  const isForeignCrosspost = isPostWithForeignId(post) && !post.fmCrosspost.hostedHere
  const [isLoadingFull, setIsLoadingFull] = useState(isForeignCrosspost);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);
  const [resetSig, setResetSig] = useState(0);


  const apolloClient = useForeignApolloClient();
  
  const documentId = isForeignCrosspost ? (post.fmCrosspost.foreignPostId ?? undefined) : post._id;

  const { document: fullPost, loading: loadingFullPost } = useSingle({
    documentId,
    collectionName: "Posts",
    apolloClient: isForeignCrosspost ? apolloClient : undefined,
    fragmentName: isForeignCrosspost ? "PostsPage" : "UltraFeedPostFragment",
    fetchPolicy: "cache-first",
    skip: !isLoadingFull
  });


  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, { documentId: post._id, documentType: 'post' });
    }
  }, [observe, post._id]);

  const handleContentExpand = useCallback((level: number, maxReached: boolean, wordCount: number) => {
    // Start loading the full post on first expand
    if (level > 0 && !isLoadingFull && !fullPost) {
      setIsLoadingFull(true);
    }

    // Show loading spinner only if we need more content than what we have
    // Compare requested breakpoint (word count) against highlight char limit
    // This is an approximation, but better than using full post word count
    const requestedWordCount = settings.postTruncationBreakpoints?.[level - 1];
    const needsMoreContentThanHighlight = requestedWordCount ? requestedWordCount > (highlightMaxChars / 5) : false;
    
    const showLoading = isLoadingFull && needsMoreContentThanHighlight && !fullPost;
    setShouldShowLoading(showLoading);

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

    if (!hasRecordedViewOnExpand) {
      void recordPostView({ post, extraEventProperties: { type: 'ultraFeedExpansion' } });
      setHasRecordedViewOnExpand(true);
    }

  }, [
    trackExpansion, 
    post, 
    captureEvent, 
    recordPostView, 
    hasRecordedViewOnExpand, 
    isLoadingFull, 
    fullPost,
    settings.postTruncationBreakpoints
  ]);

  const handleCollapse = () => {
    setResetSig((s) => s + 1);
  };

  const handleOpenDialog = useCallback((params?: {textFragment?: string}) => {
    const textFragment = params?.textFragment;
    captureEvent("ultraFeedPostItemTitleClicked", {postId: post._id});
    openDialog({
      name: "UltraFeedPostDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <Components.UltraFeedPostDialog
          {...(fullPost ? { post: fullPost } : { postId: post._id })}
          textFragment={textFragment}
          onClose={onClose}
        />
      )
    });
  }, [openDialog, post._id, captureEvent, fullPost]);

  const displayHtml = fullPost?.contents?.html || post.contents?.htmlHighlight;
  const displayWordCount = fullPost?.contents?.wordCount ?? post.contents?.wordCount;

  if (!displayHtml) {
    return <div>No post content found for post with id: {post._id}</div>; 
  }

  // TODO: instead do something like set to 200 words and display and show warning
  if (!displayWordCount) {
    return <div>No word count found for post with id: {post._id}</div>;
  }

  return (
    <AnalyticsContext ultraFeedElementType="feedPost" postId={post._id} ultraFeedCardIndex={index}>
    <div ref={elementRef} className={classes.root}>
      <AnalyticsContext pageElementContext="tripleDotMenu">
        <PostActionsButton
          post={post}
          vertical={true}
          className={classes.tripleDotMenu}
        />
      </AnalyticsContext>

      <UltraFeedPostItemHeader
        post={post}
        isRead={isRead}
        handleOpenDialog={handleOpenDialog}
      />

      {shouldShowLoading && loadingFullPost ? (
        <div className={classes.loadingContainer}>
          <Loading />
        </div>
      ) : (
        <FeedContentBody
          html={displayHtml}
          breakpoints={settings.postTruncationBreakpoints}
          initialExpansionLevel={0}
          wordCount={displayWordCount}
          nofollow={(post.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
          onContinueReadingClick={handleOpenDialog}
          onExpand={handleContentExpand}
          hideSuffix={false}
          resetSignal={resetSig}
        />
      )}
      {loadingFullPost && <div className={classes.loadingContainer}>
        <Loading />
      </div>}

      {(overflowNav.showUp || overflowNav.showDown) && <OverflowNavButtons nav={overflowNav} onCollapse={handleCollapse} />}
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
