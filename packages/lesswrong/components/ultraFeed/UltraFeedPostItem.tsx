import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { postGetPageUrl, postGetLink, postGetLinkTarget, detectLinkpost } from "@/lib/collections/posts/helpers";
import { FeedPostMetaInfo, FeedItemSourceType } from "./ultraFeedTypes";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { useRecordPostView } from "../hooks/useRecordPostView";
import classnames from "classnames";
import { highlightMaxChars } from "../../lib/editor/ellipsize";
import { useOverflowNav } from "./OverflowNavObserverContext";
import { useDialog } from "../common/withDialog";
import { isPostWithForeignId } from "../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import UltraFeedPostDialog from "./UltraFeedPostDialog";
import FormatDate from "../common/FormatDate";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import OverflowNavButtons from "./OverflowNavButtons";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import UltraFeedPostActions from "./UltraFeedPostActions";
import BookmarksIcon from "@/lib/vendor/@material-ui/icons/src/Bookmarks";
import ClockIcon from "@/lib/vendor/@material-ui/icons/src/AccessTime";
import SubscriptionsIcon from "@/lib/vendor/@material-ui/icons/src/NotificationsNone";
import LWTooltip from "../common/LWTooltip";
import { SparkleIcon } from "../icons/sparkleIcon";
import SeeLessFeedback from "./SeeLessFeedback";
import { useCurrentUser } from "../common/withUser";
import { useSeeLess } from "./useSeeLess";
import { UltraFeedCommentItem } from "./UltraFeedCommentItem";
import type { FeedCommentMetaInfo } from "./ultraFeedTypes";
import PostsUserAndCoauthors from "../posts/PostsUserAndCoauthors";
import TruncatedAuthorsList from "../posts/TruncatedAuthorsList";
import ForumIcon from "../common/ForumIcon";
import { RecombeeRecommendationsContextWrapper } from "../recommendations/RecombeeRecommendationsContextWrapper";

const localPostQuery = gql(`
  query LocalPostQuery($documentId: String!) {
    post(selector: { _id: $documentId }) {
      result {
        ...UltraFeedPostFragment
      }
    }
  }
`);

const foreignPostQuery = gql(`
  query ForeignPostQuery($documentId: String!) {
    post(selector: { _id: $documentId }) {
      result {
        ...PostsPage
      }
    }
  }
`);

const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    position: 'relative',
    paddingTop: 12,
    paddingLeft: 20,
    paddingRight: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    backdropFilter: theme.palette.filters.bannerAdBlurHeavy,
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 16,
    },
  },
  verticalLineContainer: {
    width: 0,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: -12,
    [theme.breakpoints.down('sm')]: {
      marginRight: 2,
    },
  },
  verticalLine: {
    width: 0,
    borderLeft: `5px solid ${theme.palette.grey[300]}ac`,
    flex: 1,
    marginLeft: -11,
    marginTop: 12,
    marginBottom: 12,
    [theme.breakpoints.down('sm')]: {
      marginTop: 12,
      marginBottom: 12,
    },
  },
  verticalLineHighlightedUnviewed: {
    borderLeftColor: `${theme.palette.secondary.light}ec`,
  },
  verticalLineHighlightedViewed: {
    borderLeftColor: `${theme.palette.secondary.light}5f`,
    transition: 'border-left-color 0.5s ease-out',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
  },
  greyedOut: {
    opacity: 0.5,
    filter: 'blur(0.5px)',
    pointerEvents: 'none',
  },
  tripleDotMenu: {
    position: 'relative',
    bottom: 1,
    color: theme.palette.ultraFeed.dim,
    opacity: 0.7,
    "& svg": {
      fontSize: 18,
      cursor: "pointer",
    },
    [theme.breakpoints.down('sm')]: {
      position: 'absolute',
      right: 16,
      top: 12,
      padding: 5,
      marginLeft: 4,
      zIndex: 10,
    },
  },
  header: {
    display: 'flex',
    marginBottom: 12,
    marginRight: -10, //so triple dot lines up on both posts and comments
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 16,
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
      position: 'relative',
      flexDirection: 'column',
      gap: '4px',
      alignItems: 'stretch',
    },
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      paddingRight: '30px', // To leave space for the absolutely positioned triple-dot menu
    },
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    color: theme.palette.text.bannerAdOverlay,
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    fontSize: '1.3rem',
    whiteSpace: 'normal',
    [theme.breakpoints.down('sm')]: {
      fontSize: 20.5,
      width: '100%',
      flexGrow: 1,
      paddingRight: 8,
    },
  },
  titleIsRead: {
    opacity: 0.5,
    color: theme.palette.text.bannerAdOverlay,
    '&:hover': {
      opacity: 0.9,
    },
  },
  metaRow: {
    display: "flex",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    alignItems: 'center',
    flexShrink: 0,
    flexWrap: 'nowrap',
    columnGap: '8px',
    [theme.breakpoints.down('sm')]: {
      flexWrap: "nowrap",
      alignItems: "baseline",
      rowGap: "6px",
      fontSize: "1.3rem",
      flexShrink: 1,
      width: 'auto',
    },
  },
  sourceIcon: {
    width: 16,
    height: 16,
    color: theme.palette.grey[600],
    opacity: 0.7,
    position: 'relative',
    top: 2,
    flexShrink: 0,
  },
  metaDateContainer: {
    order: 3,
    [theme.breakpoints.down('sm')]: {
      order: 2,
      flexShrink: 0,
    },
  },
  footer: {
    marginTop: 12,
    marginBottom: 12,
  },
  footerGreyedOut: {
    opacity: 0.5,
    filter: 'blur(0.5px)',
    '& > *': {
      pointerEvents: 'none',
    },
    '& .SeeLessButton-root': {
      pointerEvents: 'auto !important',
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  },
  authorsListWrapper: {
    flexGrow: 1,
    minWidth: 0,
    order: 2,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  mobileAuthorsListWrapper: {
    order: 1,
    minWidth: 0,
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  authorsList: {
    fontSize: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
  },
  newCommentContainer: {
    marginTop: 16,
    marginLeft: -16,
    marginRight: -16,
    paddingLeft: 16,
    paddingRight: 16,
    borderTop: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    paddingTop: 8,
  },
  sourceIconsContainer: {
    display: 'flex',
    alignItems: 'center',
    order: 1,
    gap: '4px',
    [theme.breakpoints.down('sm')]: {
      order: 3,
      flexShrink: 0,
    },
  },
  desktopTripleDotWrapper: {
    display: 'block',
    order: 4,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  mobileTripleDotWrapper: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      position: 'absolute',
      right: -10,
      top: 0,
      height: 'auto',
      width: 'auto',
    },
  },
}));

type HighlightStateType = 'never-highlighted' | 'highlighted-unviewed' | 'highlighted-viewed';

const sourceIconMap: Array<{ source: FeedItemSourceType, icon: any, tooltip: string }> = [
  { source: 'bookmarks' as FeedItemSourceType, icon: BookmarksIcon, tooltip: "From your bookmarks" },
  { source: 'subscriptionsPosts' as FeedItemSourceType, icon: SubscriptionsIcon, tooltip: "From users you follow" },
  { source: 'recombee-lesswrong-custom' as FeedItemSourceType, icon: SparkleIcon, tooltip: "Recommended for you" },
  { source: 'hacker-news' as FeedItemSourceType, icon: ClockIcon, tooltip: "Latest posts" },
];

interface UltraFeedPostItemHeaderProps {
  post: PostsListWithVotes;
  isRead: boolean;
  handleOpenDialog: () => void;
  sources: FeedItemSourceType[];
  isSeeLessMode: boolean;
}

const UltraFeedPostItemHeader = ({
  post,
  isRead,
  handleOpenDialog,
  sources,
  isSeeLessMode,
}: UltraFeedPostItemHeaderProps) => {
  const classes = useStyles(styles);
  const metaRowRef = useRef<HTMLDivElement>(null);

  const handleTitleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      handleOpenDialog();
    }
  };

  const sourceIcons = sourceIconMap
    .filter(({ source }) => sources.includes(source))
    .map(({ source, icon, tooltip }) => ({ icon, tooltip, key: source }));

  const { isLinkpost, linkpostDomain } = detectLinkpost(post);

  return (
    <div className={classes.header}>
      <div className={classes.titleContainer}>
        <a
          href={postGetPageUrl(post)}
          onClick={handleTitleClick}
          className={classnames(classes.title, { [classes.titleIsRead]: isRead })}
        >
          {post.title}
        </a>
      </div>
      <div className={classes.metaRow} ref={metaRowRef}>
        <div className={classes.mobileAuthorsListWrapper}>
          <TruncatedAuthorsList post={post} useMoreSuffix={false} expandContainer={metaRowRef} className={classes.authorsList} />
        </div>
        <div className={classes.authorsListWrapper}>
          <PostsUserAndCoauthors post={post} abbreviateIfLong={true} tooltipPlacement="top" />
        </div>
        {post.postedAt && (
          <span className={classes.metaDateContainer}>
            <FormatDate date={post.postedAt} />
          </span>
        )}
        <div className={classes.sourceIconsContainer}>
          {sourceIcons.map((iconInfo) => (
            <LWTooltip key={iconInfo.key} title={iconInfo.tooltip} placement="top">
              <span>
                <iconInfo.icon className={classes.sourceIcon} />
              </span>
            </LWTooltip>
          ))}
          {isLinkpost && (
            <LWTooltip title={`Linkpost from ${linkpostDomain}`} placement="top">
              <a href={postGetLink(post)} target={postGetLinkTarget(post)} onClick={(e) => e.stopPropagation()}>
                <ForumIcon icon="Link" className={classes.sourceIcon} />
              </a>
            </LWTooltip>
          )}
        </div>
        <div className={classes.desktopTripleDotWrapper}>
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <PostActionsButton
              post={post}
              vertical={true}
              autoPlace
              ActionsComponent={UltraFeedPostActions}
              className={classnames(classes.tripleDotMenu, { [classes.greyedOut]: isSeeLessMode })}
            />
          </AnalyticsContext>
        </div>
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
  const { observe, trackExpansion, hasBeenFadeViewed, subscribeToFadeView, unsubscribeFromFadeView } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { openDialog } = useDialog();
  const overflowNav = useOverflowNav(elementRef);
  const { captureEvent } = useTracking();
  const { recordPostView, isRead } = useRecordPostView(post);
  const [hasRecordedViewOnExpand, setHasRecordedViewOnExpand] = useState(false);
  const isForeignCrosspost = isPostWithForeignId(post) && !post.fmCrosspost.hostedHere
  const { displaySettings } = settings;
  const apolloClient = useForeignApolloClient();
  const currentUser = useCurrentUser();
  
  const documentId = isForeignCrosspost ? (post.fmCrosspost.foreignPostId ?? undefined) : post._id;
  
  const needsFullPostInitially = displaySettings.postInitialWords > (highlightMaxChars / 5);
  const [isLoadingFull, setIsLoadingFull] = useState(isForeignCrosspost || needsFullPostInitially);
  const [resetSig, setResetSig] = useState(0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [newComment, setNewComment] = useState<UltraFeedComment | null>(null);
  const [newCommentMetaInfo, setNewCommentMetaInfo] = useState<FeedCommentMetaInfo | null>(null);
  
  const initialHighlightState = (postMetaInfo.highlight && !hasBeenFadeViewed(post._id)) ? 'highlighted-unviewed' : 'never-highlighted';
  const [highlightState, setHighlightState] = useState<HighlightStateType>(initialHighlightState);

  useEffect(() => {
    const initialState: HighlightStateType = (postMetaInfo.highlight && !hasBeenFadeViewed(post._id)) ? 'highlighted-unviewed' : 'never-highlighted';
    setHighlightState(initialState);

    const handleFade = () => {
      setHighlightState(prev => prev === 'highlighted-unviewed' ? 'highlighted-viewed' : prev);
    };

    if (initialState === 'highlighted-unviewed') {
      subscribeToFadeView(post._id, handleFade);
    }

    return () => {
      if (initialState === 'highlighted-unviewed') {
        unsubscribeFromFadeView(post._id, handleFade);
      }
    };
  }, [postMetaInfo.highlight, post._id, hasBeenFadeViewed, subscribeToFadeView, unsubscribeFromFadeView]);

  const {
    isSeeLessMode,
    handleSeeLess,
    handleUndoSeeLess,
    handleFeedbackChange,
  } = useSeeLess({
    documentId: post._id,
    documentType: 'post',
    recommId: postMetaInfo.recommInfo?.recommId,
  });

  const { data: localPostData, loading: loadingLocalPost } = useQuery(localPostQuery, {
    skip: isForeignCrosspost || !isLoadingFull,
    fetchPolicy: "cache-first",
    variables: {
      documentId,
    },
  });

  const localPost = localPostData?.post?.result;

  const { data: foreignPostData, loading: loadingForeignPost } = useQuery(foreignPostQuery, {
    skip: !isForeignCrosspost || !isLoadingFull,
    fetchPolicy: "cache-first",
    variables: {
      documentId,
    },
    client: apolloClient,
  });

  const foreignPost = foreignPostData?.post?.result;

  const fullPost = isForeignCrosspost ? foreignPost : localPost;
  const loadingFullPost = isForeignCrosspost ? loadingForeignPost : loadingLocalPost;

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, { 
        documentId: post._id, 
        documentType: 'post',
        servedEventId: postMetaInfo.servedEventId,
        feedCardIndex: index
      });
    }
  }, [observe, post._id, postMetaInfo.servedEventId, index]);

  const handleContentExpand = useCallback((expanded: boolean, wordCount: number) => {
    setIsContentExpanded(expanded);
    
    if (expanded && !isLoadingFull && !fullPost) {
      setIsLoadingFull(true);
    }

    trackExpansion({
      documentId: post._id,
      documentType: 'post',
      level: expanded ? 1 : 0,
      maxLevelReached: expanded,
      wordCount,
      servedEventId: postMetaInfo.servedEventId,
      feedCardIndex: index,
    });

    captureEvent("ultraFeedPostItemExpanded", {
      expanded,
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
    postMetaInfo.servedEventId,
    index,
  ]);

  const handleCollapse = () => {
    setResetSig((s) => s + 1);
    setIsContentExpanded(false);
  };

  const handleReplyClick = useCallback(() => {
    setIsReplying(!isReplying);
  }, [isReplying]);

  const handleReplySubmit = useCallback((newComment: UltraFeedComment) => {
    setIsReplying(false);
    setNewComment(newComment);
    
    const defaultMetaInfo: FeedCommentMetaInfo = {
      displayStatus: 'expanded',
      sources: [],
      descendentCount: 0,
      directDescendentCount: 0,
      highlight: false,
      lastServed: new Date(),
      lastViewed: null,
      lastInteracted: new Date(),
      postedAt: newComment.postedAt ? new Date(newComment.postedAt) : new Date(),
    };
    setNewCommentMetaInfo(defaultMetaInfo);
  }, []);

  const handleReplyCancel = useCallback(() => {
    setIsReplying(false);
  }, []);

  const handleCommentEdit = useCallback((editedComment: CommentsList) => {
    if (newComment && editedComment._id === newComment._id) {
      setNewComment({
        ...editedComment,
        post,
      });
    }
  }, [newComment, post]);

  const replyConfig = useMemo(() => ({
    isReplying,
    onReplyClick: handleReplyClick,
    onReplySubmit: handleReplySubmit,
    onReplyCancel: handleReplyCancel,
  }), [isReplying, handleReplyClick, handleReplySubmit, handleReplyCancel]);

  const handleOpenDialog = useCallback((location: "title" | "content") => {
    captureEvent("ultraFeedPostDialogOpened", { location });
    trackExpansion({
      documentId: post._id,
      documentType: 'post',
      level: 1,
      maxLevelReached: true,
      wordCount: post.contents?.wordCount ?? 0,
      servedEventId: postMetaInfo.servedEventId,
      feedCardIndex: index,
    });
    
    if (!hasRecordedViewOnExpand) {
      void recordPostView({ post, extraEventProperties: { type: 'ultraFeedExpansion' } });
      setHasRecordedViewOnExpand(true);
    }
    
    openDialog({
      name: "UltraFeedPostDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <UltraFeedPostDialog
          {...(fullPost ? { post: fullPost } : { partialPost: post })}
          postMetaInfo={postMetaInfo}
          onClose={onClose}
        />
      )
    });
  }, [
    openDialog,
    post,
    captureEvent,
    fullPost,
    trackExpansion,
    postMetaInfo,
    hasRecordedViewOnExpand,
    recordPostView,
    index,
  ]);

  const shortformHtml = post.shortform 
    ? `This is a special post for quick takes (aka "shortform"). Only the owner can create top-level comments.`
    : undefined

  const displayHtml = fullPost?.contents?.html ?? post.contents?.htmlHighlight ?? shortformHtml;
  
  const displayWordCount = post.shortform ? 0 : post.contents?.wordCount;

  const truncationParams = useMemo(() => {
    return {
      initialWordCount: displaySettings.postInitialWords,
      maxWordCount: displaySettings.postMaxWords
    };
  }, [displaySettings.postInitialWords, displaySettings.postMaxWords]);

  if (!displayHtml) {
    return null; 
  }

  return (
    <RecombeeRecommendationsContextWrapper postId={post._id} recommId={postMetaInfo.recommInfo?.recommId}>
    <AnalyticsContext ultraFeedElementType="feedPost" postId={post._id} feedCardIndex={index} ultraFeedSources={postMetaInfo.sources}>
    <div className={classes.root}>
      <div className={classes.verticalLineContainer}>
        <div className={classnames(
          classes.verticalLine,
          {
            [classes.verticalLineHighlightedUnviewed]: highlightState === 'highlighted-unviewed',
            [classes.verticalLineHighlightedViewed]: highlightState === 'highlighted-viewed',
          }
        )} />
      </div>
      <div ref={elementRef} className={classes.mainContent}>
        {/* On small screens, the triple dot menu is positioned absolutely to the root */}
        <div className={classes.mobileTripleDotWrapper}>
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <PostActionsButton
              post={post}
              vertical={true}
              autoPlace
              ActionsComponent={UltraFeedPostActions}
              className={classnames(classes.tripleDotMenu, { [classes.greyedOut]: isSeeLessMode })}
            />
          </AnalyticsContext>
        </div>

        <div className={classnames({ [classes.greyedOut]: isSeeLessMode })}>
          <UltraFeedPostItemHeader
            post={post}
            isRead={isRead}
            handleOpenDialog={() => handleOpenDialog("title")}
            sources={postMetaInfo.sources}
            isSeeLessMode={isSeeLessMode}
          />
        </div>

        {isSeeLessMode && (
          <SeeLessFeedback
            onUndo={handleUndoSeeLess}
            onFeedbackChange={handleFeedbackChange}
          />
        )}
        
        {!isSeeLessMode && (
          <FeedContentBody
            html={displayHtml}
            initialWordCount={truncationParams.initialWordCount}
            maxWordCount={truncationParams.maxWordCount}
            wordCount={displayWordCount ?? 200}
            nofollow={(post.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
            onContinueReadingClick={() => handleOpenDialog("content")}
            onExpand={handleContentExpand}
            hideSuffix={loadingFullPost}
            resetSignal={resetSig}
          />
        )}
        
        {/* Show loading indicator below content if we're loading the full post */}
        {loadingFullPost && displayHtml && !isSeeLessMode && (
          <div className={classes.loadingContainer}>
            <Loading />
          </div>
        )}
        
        <UltraFeedItemFooter 
          document={post} 
          collectionName="Posts" 
          metaInfo={postMetaInfo} 
          className={classnames(classes.footer, { [classes.footerGreyedOut]: isSeeLessMode })}
          onSeeLess={isSeeLessMode ? handleUndoSeeLess : handleSeeLess}
          isSeeLessMode={isSeeLessMode}
          replyConfig={replyConfig}
        />
        
        {/* Show new comment if one was just created */}
        {newComment && newCommentMetaInfo && !isSeeLessMode && (
          <div className={classes.newCommentContainer}>
            <UltraFeedCommentItem
              comment={newComment}
              metaInfo={newCommentMetaInfo}
              onChangeDisplayStatus={() => {}}
              showPostTitle={false}
              highlight={false}
              isFirstComment={true}
              isLastComment={true}
              settings={settings}
              parentAuthorName={null}
              isHighlightAnimating={false}
              replyConfig={{
                isReplying: false,
                onReplyClick: () => {},
                onReplySubmit: () => {},
                onReplyCancel: () => {},
              }}
              cannotReplyReason="You cannot reply to your own comment within the feed"
              onEditSuccess={handleCommentEdit}
              threadIndex={index}
              commentIndex={0}
            />
          </div>
        )}
      </div>
      
      {(overflowNav.showUp || overflowNav.showDown) && <OverflowNavButtons nav={overflowNav} onCollapse={isContentExpanded ? handleCollapse : undefined} />}
    </div>
    </AnalyticsContext>
    </RecombeeRecommendationsContextWrapper>
  );
};

export default registerComponent("UltraFeedPostItem", UltraFeedPostItem);
