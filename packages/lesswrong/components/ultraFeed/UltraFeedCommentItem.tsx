import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS, readCommentsInitialWords } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { FeedCommentMetaInfo, FeedItemDisplayStatus } from "./ultraFeedTypes";
import { useOverflowNav } from "./OverflowNavObserverContext";
import { useDialog } from "../common/withDialog";
import UltraFeedPostDialog from "./UltraFeedPostDialog";
import UltraFeedCommentsItemMeta from "./UltraFeedCommentsItemMeta";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import OverflowNavButtons from "./OverflowNavButtons";
import SeeLessFeedback from "./SeeLessFeedback";
import { useSeeLess } from "./useSeeLess";
import { useCurrentUser } from "../common/withUser";
import { userIsAdmin, userOwns } from "../../lib/vulcan-users/permissions";
import CommentsEditForm from "../comments/CommentsEditForm";


const commentHeaderPaddingDesktop = 12;

const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  root: {
    borderBottom: theme.palette.border.itemSeparatorBottomStrong,
    position: 'relative',
    paddingTop: commentHeaderPaddingDesktop,
    backgroundColor: 'transparent',
    transition: 'background-color 1.0s ease-out',
    paddingLeft: 20,
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 20,
      paddingRight: 20,
      borderBottom: 'none',
    },
  },
  rootWithReadStyles: {
    backgroundColor: theme.palette.grey[300],
    [theme.breakpoints.down('sm')]: {
      backgroundColor: theme.palette.grey[100],
    },
  },
  rootWithAnimation: {
    backgroundColor: `${theme.palette.primary.main}3b`,
    transition: 'none',
  },
  moderatorComment: {
    background: theme.palette.panelBackground.commentModeratorHat,
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'row',
    maxWidth: '100%',
  },
  compressedRoot: {
    display: 'flex',
    flexDirection: 'row',
    // paddingLeft: 20,
    // paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  compressedRootWithReadStyles: {
    backgroundColor: theme.palette.grey[300],
    borderBottom: theme.palette.border.itemSeparatorBottomStrong,
    [theme.breakpoints.down('sm')]: {
      backgroundColor: theme.palette.grey[100],
    },
  },
  commentContentWrapper: {
    maxWidth: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
  },
  commentContentWrapperWithBorder: {
    // borderBottom: theme.palette.border.itemSeparatorBottom,
    [theme.breakpoints.down('sm')]: {
      borderBottom: 'none',
    },
  },
  commentHeader: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
    position: 'relative',
  },
  contentWrapper: {
    marginTop: 12,
    marginBottom: 12,
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
    },
  },
  contentWrapperWithReadStyles: {
    opacity: 0.9,
    [theme.breakpoints.down('sm')]: {
      opacity: 0.7,
    },
  },
  numComments: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    opacity: 0.5,
    cursor: "pointer",
    color: theme.palette.text.bannerAdOverlay,
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('sm')]: {
      padding: 6,
      fontSize: theme.typography.ultraFeedMobileStyle.fontSize,
    },
  },
  numCommentsWithReadStyles: {
    opacity: 0.6,
    [theme.breakpoints.down('sm')]: {
      opacity: 0.7,
    },
  },
  verticalLineContainer: {
    fontStyle: 'italic',
    width: 0,
    display: 'none',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: -commentHeaderPaddingDesktop,
    marginBottom: 0,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  verticalLineContainerCompressed: {
    width: 0,
    display: 'none',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 0,
    marginBottom: 0,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  verticalLine: {
    width: 0,
    borderLeft: `4px solid ${theme.palette.grey[300]}ac`,
    flex: 1,
    marginLeft: -12,
  },
  verticalLineHighlightedUnviewed: {
    borderLeftColor: `${theme.palette.secondary.light}ec`,
  },
  verticalLineHighlightedViewed: {
    borderLeftColor: `${theme.palette.secondary.light}5f`,
    transition: 'border-left-color 0.5s ease-out',
  },
  verticalLineFirstComment: {
    marginTop: commentHeaderPaddingDesktop,
  },
  verticalLineLastComment: {
    marginBottom: commentHeaderPaddingDesktop,
  },
  footer: {
    marginBottom: 12,
  },
  greyedOut: {
    opacity: 0.5,
    filter: 'blur(0.5px)',
    pointerEvents: 'none',
  },
  footerGreyedOut: {
    opacity: 0.5,
    filter: 'blur(0.5px)',
    '& > *': {
      pointerEvents: 'none',
    },
  },
  branchNavContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&:hover': {
      opacity: 0.8,
    },
  },
  branchNavText: {
    fontStyle: 'italic',
  },
}));

type HighlightStateType = 'never-highlighted' | 'highlighted-unviewed' | 'highlighted-viewed';

const BranchNavigationButton = ({
  currentBranch,
  onBranchToggle,
}: {
  currentBranch?: 'new' | 'original';
  onBranchToggle?: () => void;
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  
  const handleClick = () => {
    captureEvent("ultraFeedBranchNavigationClicked", { 
      currentBranch,
      switchingTo: currentBranch === 'new' ? 'original' : 'new'
    });
    onBranchToggle?.();
  };
  
  return (
    <div className={classes.branchNavContainer} onClick={handleClick}>
      <span className={classes.branchNavText}>
        {currentBranch === 'new' ? 'View original thread' : 'View your new reply'}
      </span>
    </div>
  );
};

export const UltraFeedCompressedCommentsItem = ({
  numComments, 
  setExpanded,
  isFirstComment = false,
  isLastComment = false,
  isHighlighted = false,
  isRead = false,
}: {
  numComments: number, 
  setExpanded: () => void,
  isFirstComment?: boolean,
  isLastComment?: boolean,
  isHighlighted?: boolean,
  isRead?: boolean,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  
  const handleClick = () => {
    captureEvent("ultraFeedCompressedCommentsClicked", { 
      numComments,
      numExpanded: Math.min(3, numComments), // We always expand max 3 at a time
      isFirstComment,
      isLastComment,
    });
    setExpanded();
  };
  
  return (
    <div 
      onClick={handleClick}
      className={classNames(classes.compressedRoot, { [classes.compressedRootWithReadStyles]: isRead })}
    >
      <div className={classes.verticalLineContainerCompressed}>
        <div className={classNames(
          classes.verticalLine,
          { 
            [classes.verticalLineHighlightedUnviewed]: isHighlighted,
            [classes.verticalLineFirstComment]: isFirstComment,
            [classes.verticalLineLastComment]: isLastComment
          }
        )} />
      </div>
      <div className={classNames(classes.commentContentWrapper, { [classes.commentContentWrapperWithBorder]: !isLastComment })}>
        <div className={classNames(classes.numComments, {
          [classes.numCommentsWithReadStyles]: isRead
        })}>
          <span>+{numComments} comments</span>
        </div>
      </div>
    </div>
  );
};

export interface ReplyConfig {
  isReplying: boolean;
  onReplyClick: () => void;
  onReplySubmit: (newComment: UltraFeedComment) => void;
  onReplyCancel: () => void;
}

export interface UltraFeedCommentItemProps {
  comment: UltraFeedComment;
  metaInfo: FeedCommentMetaInfo;
  onChangeDisplayStatus: (newStatus: "expanded" | "collapsed" | "hidden") => void;
  showPostTitle?: boolean;
  highlight?: boolean;
  isFirstComment?: boolean;
  isLastComment?: boolean;
  onPostTitleClick?: () => void;
  settings?: UltraFeedSettingsType;
  parentAuthorName?: string | null;
  onReplyIconClick?: () => void;
  isHighlightAnimating?: boolean;
  replyConfig: ReplyConfig;
  hasFork?: boolean;
  currentBranch?: 'new' | 'original';
  onBranchToggle?: () => void;
  cannotReplyReason?: string | null;
  onEditSuccess: (editedComment: CommentsList) => void;
  threadIndex?: number;
  commentIndex?: number;
}

export const UltraFeedCommentItem = ({
  comment,
  metaInfo,
  onChangeDisplayStatus,
  showPostTitle,
  highlight = false,
  isFirstComment = false,
  isLastComment = false,
  onPostTitleClick,
  settings = DEFAULT_SETTINGS,
  parentAuthorName,
  onReplyIconClick,
  isHighlightAnimating = false,
  replyConfig,
  hasFork,
  currentBranch,
  onBranchToggle,
  cannotReplyReason: customCannotReplyReason,
  onEditSuccess,
  threadIndex,
  commentIndex,
}: UltraFeedCommentItemProps) => {
  const classes = useStyles(styles);
  const { observe, unobserve, trackExpansion, hasBeenFadeViewed, subscribeToFadeView, unsubscribeFromFadeView } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { openDialog } = useDialog();
  const overflowNav = useOverflowNav(elementRef);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  
  const cannotReplyReason = customCannotReplyReason ?? (userOwns(currentUser, comment) ? "You cannot reply to your own comment from within the feed" : null);

  const displayStatus = metaInfo.displayStatus ?? 'expanded';
  const isRead = !!metaInfo.lastViewed || !!metaInfo.lastInteracted

  const initialHighlightState = (highlight && !hasBeenFadeViewed(comment._id)) ? 'highlighted-unviewed' : 'never-highlighted';
  const [highlightState, setHighlightState] = useState<HighlightStateType>(initialHighlightState);
  const [resetSig, setResetSig] = useState(0);
  const [showEditState, setShowEditState] = useState(false);
  
  const {
    isSeeLessMode,
    handleSeeLessClick,
    handleFeedbackChange,
  } = useSeeLess({
    documentId: comment._id,
    collectionName: 'Comments',
    metaInfo,
  });

  const { displaySettings } = settings;

  const setShowEdit = useCallback(() => {
    setShowEditState(true);
  }, []);

  const editCancelCallback = useCallback(() => {
    setShowEditState(false);
  }, []);

  const editSuccessCallback = useCallback((editedComment: CommentsList) => {
    setShowEditState(false);
    onEditSuccess(editedComment);
  }, [onEditSuccess]);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, {
        documentId: comment._id,
        documentType: 'comment',
        postId: comment.postId ?? undefined,
        servedEventId: metaInfo.servedEventId,
        feedCardIndex: threadIndex,
        feedCommentIndex: commentIndex
      });
    }

    return () => {
      if (currentElement) {
        unobserve(currentElement);
      }
    };
  }, [observe, unobserve, comment._id, comment.postId, metaInfo.servedEventId, threadIndex, commentIndex]);

  // Manage highlight fading using observer's fade timer (2s)
  useEffect(() => {
    const initialState: HighlightStateType = (highlight && !hasBeenFadeViewed(comment._id)) ? 'highlighted-unviewed' : 'never-highlighted';
    setHighlightState(initialState);

    const handleFade = () => {
      setHighlightState(prev => prev === 'highlighted-unviewed' ? 'highlighted-viewed' : prev);
    };

    if (initialState === 'highlighted-unviewed') {
      subscribeToFadeView(comment._id, handleFade);
    }

    return () => {
      if (initialState === 'highlighted-unviewed') {
        unsubscribeFromFadeView(comment._id, handleFade);
      }
    };
  }, [highlight, comment._id, hasBeenFadeViewed, subscribeToFadeView, unsubscribeFromFadeView]);

  const handleContentExpand = useCallback((expanded: boolean, wordCount: number) => {
    trackExpansion({
      documentId: comment._id,
      documentType: 'comment',
      postId: comment.postId ?? undefined,
      level: expanded ? 1 : 0,
      maxLevelReached: expanded,
      wordCount,
      servedEventId: metaInfo.servedEventId,
      feedCardIndex: threadIndex,
      feedCommentIndex: commentIndex,
    });
    
    captureEvent("ultraFeedCommentItemExpanded", {
      expanded,
      wordCount,
    });

    // If the comment was previously collapsed and is now expanding,
    // update its display status in the parent component.
    if (displayStatus === "collapsed" && expanded) {
      onChangeDisplayStatus("expanded");
    }

  }, [trackExpansion, comment._id, comment.postId, displayStatus, onChangeDisplayStatus, metaInfo.servedEventId, captureEvent, threadIndex, commentIndex]);

  const handleContinueReadingClick = useCallback(() => {
    captureEvent("ultraFeedCommentItemContinueReadingClicked");
    
    // If comment doesn't have a post, we can't open the dialog but this should never happen
    if (!comment.post) {
      return;
    }
    
    const post = comment.post;
    
    openDialog({
      name: "UltraFeedPostDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <UltraFeedPostDialog 
          partialPost={post}
          postMetaInfo={{
            sources: metaInfo.sources,
            displayStatus: 'expanded' as const,
            servedEventId: metaInfo.servedEventId ?? '',
            highlight: false
          }}
          targetCommentId={comment._id}
          topLevelCommentId={comment.topLevelCommentId ?? comment._id}
          onClose={onClose}
        />
      )
    });
  }, [openDialog, comment, captureEvent, metaInfo]);

  const truncationParams = useMemo(() => {
    const { displaySettings } = settings;
    
    let initialWordCount: number;
    
    // If this comment is fully expanded, show maximum content
    if (displayStatus === "expandedToMaxInPlace") {
      initialWordCount = displaySettings.commentMaxWords;
    } else if (displayStatus === "hidden") {
      initialWordCount = 10;
    } else if (displayStatus === "collapsed") {
      initialWordCount = displaySettings.commentCollapsedInitialWords;
    } else {
      initialWordCount = displaySettings.commentExpandedInitialWords;
    }
    
    return {
      initialWordCount,
      maxWordCount: displaySettings.commentMaxWords
    };
  }, [settings, displayStatus]);

  const collapseToFirst = () => {
    setResetSig((s)=>s+1);
    onChangeDisplayStatus('collapsed');
  };

  const showModeratorCommentAnnotation = comment.moderatorHat && (!comment.hideModeratorHat || userIsAdmin(currentUser));

  let initialWordCount
  /* The first condition exists for when a read comment has been revealed by clicking on +N comments.
  /* We then set it to expanded for convenience due to revealed interest
  */
  if (displayStatus === "expandedToMaxInPlace") {
    initialWordCount = truncationParams.maxWordCount;
  } else if (isRead) {
    initialWordCount = readCommentsInitialWords;
  } else {
    initialWordCount = truncationParams.initialWordCount;
  }


  return (
    <AnalyticsContext ultraFeedElementType="feedComment" commentId={comment._id} postId={comment.postId ?? undefined} ultraFeedSources={metaInfo.sources}>
    <div className={classNames(classes.root, {
      [classes.rootWithAnimation]: isHighlightAnimating,
      [classes.rootWithReadStyles]: isRead,
      [classes.moderatorComment]: showModeratorCommentAnnotation,
    })}>
      <div className={classes.mainContent}>
        <div className={classes.verticalLineContainer}>
          <div className={classNames(
            classes.verticalLine,
            {
              [classes.verticalLineHighlightedUnviewed]: highlightState === 'highlighted-unviewed',
              [classes.verticalLineHighlightedViewed]: highlightState === 'highlighted-viewed',
              [classes.verticalLineFirstComment]: isFirstComment,
              [classes.verticalLineLastComment]: isLastComment
            }
          )} />
        </div>
        <div ref={elementRef} className={
          classNames(classes.commentContentWrapper, { 
            [classes.commentContentWrapperWithBorder]: !isLastComment,
          })}>
          <div className={classNames(classes.commentHeader, { [classes.greyedOut]: isSeeLessMode })}>
            {hasFork && <BranchNavigationButton
              currentBranch={currentBranch}
              onBranchToggle={onBranchToggle}
            />}
            <UltraFeedCommentsItemMeta
              comment={comment}
              metaInfo={metaInfo}
              setShowEdit={setShowEdit}
              showPostTitle={showPostTitle}
              onPostTitleClick={onPostTitleClick}
              parentAuthorName={parentAuthorName}
              onReplyIconClick={onReplyIconClick}
              onSeeLess={handleSeeLessClick}
              isSeeLessMode={isSeeLessMode}
            />
          </div>
          {isSeeLessMode && (
            <SeeLessFeedback
              onUndo={handleSeeLessClick}
              onFeedbackChange={handleFeedbackChange}
            />
          )}
          {!isSeeLessMode && (
            <div className={classNames(
              classes.contentWrapper, 
              { [classes.contentWrapperWithReadStyles]: isRead && !isSeeLessMode && !showEditState }
            )}>
              {showEditState ? (
                <CommentsEditForm
                  comment={comment}
                  successCallback={editSuccessCallback}
                  cancelCallback={editCancelCallback}
                />
              ) : (
                <FeedContentBody
                  html={comment.contents?.html ?? ""}
                  initialWordCount={initialWordCount}
                  maxWordCount={truncationParams.maxWordCount}
                  wordCount={comment.contents?.wordCount ?? 0}
                  nofollow={(comment.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
                  clampOverride={displaySettings.lineClampNumberOfLines}
                  onExpand={handleContentExpand}
                  onContinueReadingClick={handleContinueReadingClick}
                  hideSuffix={false}
                  resetSignal={resetSig}
                />
              )}
            </div>
          )}
          {!showEditState && <UltraFeedItemFooter
              document={comment}
              collectionName="Comments"
              metaInfo={metaInfo}
              className={classNames(classes.footer, { [classes.footerGreyedOut]: isSeeLessMode })}
              replyConfig={replyConfig}
              cannotReplyReason={cannotReplyReason}
            />}
        </div>
      </div>
      
      {/* buttons are placed separately within root because display: flex disrupts their positioning */}
      {(overflowNav.showUp || overflowNav.showDown) && <OverflowNavButtons nav={overflowNav} onCollapse={collapseToFirst} applyCommentStyle={true} />}
    </div>
    </AnalyticsContext>
  );
};

