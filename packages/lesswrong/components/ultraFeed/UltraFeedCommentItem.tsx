import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { AnalyticsContext, captureEvent } from "@/lib/analyticsEvents";
import { FeedCommentMetaInfo } from "./ultraFeedTypes";

const commentHeaderPaddingDesktop = 12;
const commentHeaderPaddingMobile = 12;


const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  root: {
    paddingTop: commentHeaderPaddingDesktop,
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      paddingTop: commentHeaderPaddingMobile,
    },
  },
  compressedRoot: {
    display: 'flex',
    flexDirection: 'row',
  },
  commentContentWrapper: {
    flex: 1,
  },
  commentContentWrapperWithBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  commentHeader: {
    marginBottom: 8,
  },
  contentWrapper: {
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
  inlineCommentThreadTitle: {
    marginTop: 12,
    marginBottom: 12,
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    width: '100%',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    fontStyle: 'italic',
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.ultraFeedMobileStyle.fontSize,
    },
  },
  inlineCommentThreadTitleLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    display: 'inline',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    color: theme.palette.link.dim,
    fontStyle: 'italic',
    textAlign: 'left',
    width: '100%',

    '& span': {
      color: theme.palette.primary.main,
    },
    '-webkit-line-clamp': 2,
  },
  inlineCommentThreadTitleLinkSpan: {
    '-webkit-line-clamp': 2,
  },
  verticalLineContainer: {
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
    paddingTop: 8,
    paddingBottom: 12,
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
  showInLineCommentThreadTitle?: boolean;
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
  showInLineCommentThreadTitle,
  highlight = false,
  isFirstComment = false,
  isLastComment = false,
  onPostTitleClick,
  settings = DEFAULT_SETTINGS,
}: UltraFeedCommentItemProps) => {
  const classes = useStyles(styles);
  const { UltraFeedCommentsItemMeta, FeedContentBody, UltraFeedItemFooter } = Components;
  const { observe, unobserve, trackExpansion, hasBeenLongViewed, subscribeToLongView, unsubscribeFromLongView } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { post } = comment;
  const { displayStatus } = metaInfo;

  const initialHighlightState = (highlight && !hasBeenLongViewed(comment._id)) ? 'highlighted-unviewed' : 'never-highlighted';
  const [highlightState, setHighlightState] = useState<HighlightStateType>(initialHighlightState);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, {
        documentId: comment._id,
        documentType: 'comment',
        postId: comment.postId
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
      postId: comment.postId,
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

  const expanded = displayStatus === "expanded";

  const truncationBreakpoints = useMemo(() => {
    return settings.commentTruncationBreakpoints || [];
  }, [settings.commentTruncationBreakpoints]);

  return (
    <AnalyticsContext ultraFeedElementType="feedComment" ultraFeedCardId={comment._id}>
    <div ref={elementRef} className={classNames(classes.root)} >
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
      
      <div className={classNames(classes.commentContentWrapper, { [classes.commentContentWrapperWithBorder]: !isLastComment })}>
        <div className={classes.commentHeader}>
          <UltraFeedCommentsItemMeta comment={comment} setShowEdit={() => {}} />
          {showInLineCommentThreadTitle && !comment.shortform && post && (
            <div className={classes.inlineCommentThreadTitle}>
              <button 
                className={classes.inlineCommentThreadTitleLink}
                onClick={onPostTitleClick}
              >
                Replying to <span className={classes.inlineCommentThreadTitleLinkSpan}>{post.title}</span>
              </button>
            </div>
          )}
        </div>
        <div className={classes.contentWrapper}>
          <FeedContentBody
            comment={comment}
            html={comment.contents?.html ?? ""}
            breakpoints={truncationBreakpoints ?? []}
            wordCount={comment.contents?.wordCount ?? 0}
            linkToDocumentOnFinalExpand={expanded}
            initialExpansionLevel={0}
            nofollow={(comment.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
            clampOverride={settings.lineClampNumberOfLines}
            onExpand={handleContentExpand}
            hideSuffix={false}
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
