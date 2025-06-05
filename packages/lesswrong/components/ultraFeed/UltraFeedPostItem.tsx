import React, { useState, useCallback, useRef, useEffect } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { FeedPostMetaInfo, FeedItemSourceType } from "./ultraFeedTypes";
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
import { Link } from "../../lib/reactRouterWrapper";
import UltraFeedPostDialog from "./UltraFeedPostDialog";
import TruncatedAuthorsList from "../posts/TruncatedAuthorsList";
import FormatDate from "../common/FormatDate";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import OverflowNavButtons from "./OverflowNavButtons";
import UltraFeedPostActions from "./UltraFeedPostActions";
import BookmarksIcon from "@/lib/vendor/@material-ui/icons/src/Bookmarks";
import ClockIcon from "@/lib/vendor/@material-ui/icons/src/AccessTime";
import SubscriptionsIcon from "@/lib/vendor/@material-ui/icons/src/NotificationsNone";
import LWTooltip from "../common/LWTooltip";
import { SparkleIcon } from "../icons/sparkleIcon";

const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    position: 'relative',
    paddingLeft: 16,
    paddingRight: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
  sourceIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    color: theme.palette.grey[600],
    opacity: 0.7,
    position: 'relative',
    top: 2,
    flexShrink: 0,
  },
  metaDateContainer: {
    marginRight: 8,
  },
  footer: {
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
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
}));

interface UltraFeedPostItemHeaderProps {
  post: PostsListWithVotes;
  isRead: boolean;
  handleOpenDialog: (params?: { textFragment?: string }) => void;
  postTitlesAreModals: boolean;
  sources: FeedItemSourceType[];
}

const UltraFeedPostItemHeader = ({
  post,
  isRead,
  handleOpenDialog,
  postTitlesAreModals,
  sources,
}: UltraFeedPostItemHeaderProps) => {
  const classes = useStyles(styles);
  const authorListRef = useRef<HTMLDivElement>(null);

  const handleTitleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      handleOpenDialog();
    }
  };

  const getSourceIcon = () => {
    if (sources.includes('bookmarks')) {
      return { icon: BookmarksIcon, tooltip: "From your bookmarks" };
    }
    if (sources.includes('subscriptions')) {
      return { icon: SubscriptionsIcon, tooltip: "From users you follow" };
    }
    if (sources.includes('recombee-lesswrong-custom')) {
      return { icon: SparkleIcon, tooltip: "Recommended for you" };
    }
    if (sources.includes('hacker-news')) {
      return { icon: ClockIcon, tooltip: "Latest posts" };
    }
    return null;
  };

  const sourceIconInfo = getSourceIcon();

  return (
    <div className={classes.header}>
      <div className={classes.titleContainer}>
        {sourceIconInfo && (
          <LWTooltip title={sourceIconInfo.tooltip} placement="top">
            <span>
              <sourceIconInfo.icon className={classes.sourceIcon} />
            </span>
          </LWTooltip>
        )}
        {/* Mobile version: Respects postTitlesAreModals */}
        <div className={classes.hideOnDesktop}>
          {postTitlesAreModals ? (
            <a
              href={postGetPageUrl(post)}
              onClick={handleTitleClick}
              className={classnames(classes.title, { [classes.titleIsRead]: isRead })}
            >
              {post.title}
            </a>
          ) : (
            <Link
              to={postGetPageUrl(post)}
              className={classnames(classes.title, { [classes.titleIsRead]: isRead })}
            >
              {post.title}
            </Link>
          )}
        </div>
        {/* Desktop version: Always a link */}
        <div className={classes.hideOnMobile}>
          <Link
            to={postGetPageUrl(post)}
            className={classnames(classes.title, { [classes.titleIsRead]: isRead })}
          >
            {post.title}
          </Link>
        </div>
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

  const { displaySettings } = settings;
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
    const requestedWordCount = displaySettings.postTruncationBreakpoints?.[level - 1];
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
    displaySettings.postTruncationBreakpoints
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
        <UltraFeedPostDialog
          {...(fullPost ? { post: fullPost } : { postId: post._id })}
          textFragment={textFragment}
          onClose={onClose}
        />
      )
    });
  }, [openDialog, post._id, captureEvent, fullPost]);

  const shortformHtml = post.shortform 
    ? `This is a special post for quick takes (aka "shortform"). Only the owner can create top-level comments.`
    : undefined

  const displayHtml = fullPost?.contents?.html ?? post.contents?.htmlHighlight ?? shortformHtml;
  const displayWordCount = fullPost?.contents?.wordCount ?? post.contents?.wordCount ?? (post.shortform ? 0 : undefined);

  if (!displayHtml) {
    return <div>No post content found for post with id: {post._id}</div>; 
  }


  // TODO: instead do something like set to 200 words and display and show warning
  if (!displayWordCount && (!post.shortform && displayWordCount === 0)) {
    return <div>No word count found for post with id: {post._id}</div>;
  }


  return (
    <AnalyticsContext ultraFeedElementType="feedPost" postId={post._id} ultraFeedCardIndex={index}>
    <div className={classes.root}>
      <div ref={elementRef} className={classes.mainContent}>
        <AnalyticsContext pageElementContext="tripleDotMenu">
          <PostActionsButton
            post={post}
            vertical={true}
            autoPlace
            ActionsComponent={UltraFeedPostActions}
            className={classes.tripleDotMenu}
          />
        </AnalyticsContext>

        <UltraFeedPostItemHeader
          post={post}
          isRead={isRead}
          handleOpenDialog={handleOpenDialog}
          postTitlesAreModals={displaySettings.postTitlesAreModals}
          sources={postMetaInfo.sources}
        />

        {shouldShowLoading && loadingFullPost ? (
          <div className={classes.loadingContainer}>
            <Loading />
          </div>
        ) : (
          <FeedContentBody
            html={displayHtml}
            breakpoints={displaySettings.postTruncationBreakpoints}
            initialExpansionLevel={0}
            wordCount={displayWordCount!} // assertion because of shortform case that will at least be zero but isn't detected as such
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

        <UltraFeedItemFooter document={post} collectionName="Posts" metaInfo={postMetaInfo} className={classes.footer} />
      </div>
      {(overflowNav.showUp || overflowNav.showDown) && <OverflowNavButtons nav={overflowNav} onCollapse={handleCollapse} />}
    </div>
    </AnalyticsContext>
  );
};

export default registerComponent("UltraFeedPostItem", UltraFeedPostItem);



 
