import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { AnalyticsContext, captureEvent } from "@/lib/analyticsEvents";
import { FeedCommentMetaInfo } from "./ultraFeedTypes";
import { useOverflowNav } from "./OverflowNavObserverContext";
import { useDialog } from "../common/withDialog";

const commentHeaderPaddingDesktop = 12;
const commentHeaderPaddingMobile = 12;


const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  root: {
    position: 'relative',
    paddingTop: commentHeaderPaddingDesktop,
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'row',
  },
  compressedRoot: {
    display: 'flex',
    flexDirection: 'row',
  },
  commentContentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  commentContentWrapperWithBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  commentHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  contentWrapper: {
    marginTop: 12,
    marginBottom: 12,
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
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
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('sm')]: {
      padding: 6,
      fontSize: theme.typography.ultraFeedMobileStyle.fontSize,
    },
  },
  verticalLineContainer: {
    fontStyle: 'italic',
    width: 0,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: -commentHeaderPaddingDesktop,
    marginBottom: 0,
    [theme.breakpoints.down('sm')]: {
      marginRight: 2,
      marginTop: -commentHeaderPaddingMobile,
    },
  },
  verticalLineContainerCompressed: {
    width: 0,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 0,
    [theme.breakpoints.down('sm')]: {
      marginRight: 2,
    },
  },
  verticalLine: {
    width: 0,
    borderLeft: `4px solid ${theme.palette.grey[300]}ac`,
    flex: 1,
    marginLeft: -10,
  },
  verticalLineHighlightedUnviewed: {
    borderLeftColor: `${theme.palette.secondary.light}bc`,
  },
  verticalLineHighlightedViewed: {
    borderLeftColor: `${theme.palette.secondary.light}6c`,
    transition: 'border-left-color 1.0s ease-out',
  },
  verticalLineFirstComment: {
    marginTop: commentHeaderPaddingDesktop,
    [theme.breakpoints.down('sm')]: {
      marginTop: commentHeaderPaddingMobile,
    },
  },
  verticalLineLastComment: {
    marginBottom: commentHeaderPaddingDesktop,
    [theme.breakpoints.down('sm')]: {
      marginBottom: commentHeaderPaddingMobile,
    },
  },
  footer: {
    marginBottom: 12,
  },
}));

type HighlightStateType = 'never-highlighted' | 'highlighted-unviewed' | 'highlighted-viewed';

const UltraFeedCompressedCommentsItem = ({
  numComments, 
  setExpanded,
  isFirstComment = false,
  isLastComment = false,
}: {
  numComments: number, 
  setExpanded: () => void,
  isFirstComment?: boolean,
  isLastComment?: boolean,
}) => {
  const classes = useStyles(styles);
  
  return (
    <div className={classes.compressedRoot} onClick={setExpanded}>
      <div className={classes.verticalLineContainerCompressed}>
        <div className={classNames(
          classes.verticalLine,
          { 
            [classes.verticalLineFirstComment]: isFirstComment,
            [classes.verticalLineLastComment]: isLastComment
          }
        )} />
      </div>
      <div className={classNames(classes.commentContentWrapper, { [classes.commentContentWrapperWithBorder]: !isLastComment })}>
        <div className={classes.numComments}>
          <span>+{numComments} comments</span>
        </div>
      </div>
    </div>
  );
};

const UltraFeedCompressedCommentsItemComponent = registerComponent("UltraFeedCompressedCommentsItem", UltraFeedCompressedCommentsItem);

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
}

const UltraFeedCommentItem = ({
  comment,
  metaInfo,
  onChangeDisplayStatus,
  showPostTitle,
  highlight = false,
  isFirstComment = false,
  isLastComment = false,
  onPostTitleClick,
  settings = DEFAULT_SETTINGS,
}: UltraFeedCommentItemProps) => {
  const classes = useStyles(styles);
  const { UltraFeedCommentsItemMeta, FeedContentBody, UltraFeedItemFooter, OverflowNavButtons } = Components;
  const { observe, unobserve, trackExpansion, hasBeenLongViewed, subscribeToLongView, unsubscribeFromLongView } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { openDialog } = useDialog();
  const overflowNav = useOverflowNav(elementRef);
  const { post } = comment;
  const { displayStatus } = metaInfo;

  const initialHighlightState = (highlight && !hasBeenLongViewed(comment._id)) ? 'highlighted-unviewed' : 'never-highlighted';
  const [highlightState, setHighlightState] = useState<HighlightStateType>(initialHighlightState);
  const [resetSig, setResetSig] = useState(0);

  const { displaySettings } = settings;

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, {
        documentId: comment._id,
        documentType: 'comment',
        postId: comment.postId ?? undefined
      });
    }

    return () => {
      if (currentElement) {
        unobserve(currentElement);
      }
    };
  }, [observe, unobserve, comment._id, comment.postId]);

  useEffect(() => {
    const initialHighlightState = highlight && !hasBeenLongViewed(comment._id) ? 'highlighted-unviewed' : 'never-highlighted';
    setHighlightState(initialHighlightState);

    const handleLongView = () => {
      setHighlightState(prevState => prevState === 'highlighted-unviewed' ? 'highlighted-viewed' : prevState);
    };

    if (initialHighlightState === 'highlighted-unviewed') {
      subscribeToLongView(comment._id, handleLongView);
    }

    return () => {
      if (initialHighlightState === 'highlighted-unviewed') {
        unsubscribeFromLongView(comment._id, handleLongView);
      }
    };
  }, [highlight, comment._id, hasBeenLongViewed, subscribeToLongView, unsubscribeFromLongView]);

  const handleContentExpand = useCallback((level: number, maxReached: boolean, wordCount: number) => {
    trackExpansion({
      documentId: comment._id,
      documentType: 'comment',
      postId: comment.postId ?? undefined,
      level,
      maxLevelReached: maxReached,
      wordCount,
    });
    
    captureEvent("ultraFeedCommentItemExpanded", {
      commentId: comment._id,
      postId: comment.postId,
      level,
      maxLevelReached: maxReached,
      wordCount,
    });

    // If the comment was previously collapsed and is now expanding (level > 0),
    // update its display status in the parent component.
    if (displayStatus === "collapsed" && level > 0) {
      onChangeDisplayStatus("expanded");
    }

  }, [trackExpansion, comment._id, comment.postId, displayStatus, onChangeDisplayStatus]);

  const handleContinueReadingClick = useCallback(() => {
    captureEvent("ultraFeedCommentItemContinueReadingClicked", { commentId: comment._id, postId: comment.postId });
    openDialog({
      name: "UltraFeedCommentsDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <Components.UltraFeedCommentsDialog 
          document={comment}
          collectionName="Comments"
          onClose={onClose}
        />
      )
    });
  }, [openDialog, comment]);

  const truncationBreakpoints = useMemo(() => {
    return displaySettings.commentTruncationBreakpoints || [];
  }, [displaySettings.commentTruncationBreakpoints]);

  const collapseToFirst = () => {
    setResetSig((s)=>s+1);
    onChangeDisplayStatus('collapsed');
  };

  return (
    <AnalyticsContext ultraFeedElementType="feedComment" ultraFeedCardId={comment._id}>
    <div className={classes.root}>
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
        <div ref={elementRef} className={classNames(classes.commentContentWrapper, { [classes.commentContentWrapperWithBorder]: !isLastComment })}>
          <div className={classes.commentHeader}>
            <UltraFeedCommentsItemMeta
              comment={comment}
              setShowEdit={() => {}}
              showPostTitle={showPostTitle}
              onPostTitleClick={onPostTitleClick} />
          </div>
          <div className={classes.contentWrapper}>
            <FeedContentBody
              html={comment.contents?.html ?? ""}
              breakpoints={truncationBreakpoints ?? []}
              wordCount={comment.contents?.wordCount ?? 0}
              initialExpansionLevel={displayStatus === "expanded" ? 1 : 0}
              nofollow={(comment.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
              clampOverride={displaySettings.lineClampNumberOfLines}
              onExpand={handleContentExpand}
              onContinueReadingClick={handleContinueReadingClick}
              hideSuffix={false}
              resetSignal={resetSig}
            />
          </div>
          <UltraFeedItemFooter
            document={comment}
            collectionName="Comments"
            metaInfo={metaInfo}
            className={classes.footer}
          />
        </div>
      </div>
      {/* buttons are placed separately within root because display: flex disrupts their positioning */}
      {(overflowNav.showUp || overflowNav.showDown) && <OverflowNavButtons nav={overflowNav} onCollapse={collapseToFirst} applyCommentStyle={true} />}
    </div>
    </AnalyticsContext>
  );
};

const UltraFeedCommentItemComponent = registerComponent("UltraFeedCommentItem", UltraFeedCommentItem);

export default UltraFeedCommentItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentItem: typeof UltraFeedCommentItemComponent
    UltraFeedCompressedCommentsItem: typeof UltraFeedCompressedCommentsItemComponent
  }
}
