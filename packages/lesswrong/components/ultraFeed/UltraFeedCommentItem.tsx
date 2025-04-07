import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { DisplayFeedComment } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";
import { Link } from "@/lib/reactRouterWrapper";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { useUltraFeedSettings } from "../../lib/ultraFeedSettings";
import { useUltraFeedObserver } from "./UltraFeedObserver";


// Styles for the UltraFeedCommentItem component
const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  root: {
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'row',
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
    // paddingBottom: 16,
  },
  collapsedFooter: {
    paddingBottom: 16,
  },
  hidden: {
    display: 'none',
  },
  commentHeader: {
    marginBottom: 8,
  },
  contentWrapper: {
    // cursor: "pointer",
  },
  replyButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginRight: 6,
    display: "inline",
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    cursor: "pointer",
  },
  commentBottom: {
    marginTop: 12,
  },
  voteContainer: {
    marginLeft: 10,
  },
  numComments: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    fontSize: '1.3rem',
    opacity: 0.5,
    cursor: "pointer",
    '&:hover': {
      opacity: 1,
    },
  },
  inlineCommentThreadTitle: {
    marginTop: 12,
    marginBottom: 12,
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.3rem',
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    width: '100%',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    fontStyle: 'italic',
  },
  inlineCommentThreadTitleAbove: {
    marginTop: 0,
    marginBottom: 12,
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.3rem',
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    width: '100%',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    fontStyle: 'italic',
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
  },
  verticalLineContainer: {
    width: 0,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 2,
    marginTop: -17,
    marginBottom: 0,
  },
  verticalLineContainerCompressed: {
    width: 0,
    display: 'flex',
    justifyContent: 'center',
    marginRight: 2,
    // marginTop: -17,
    marginBottom: 0,
  },
  verticalLine: {
    width: 0,
    borderLeft: `4px solid ${theme.palette.grey[300]}`,
    flex: 1,
    marginLeft: -10
  },
  verticalLineHighlighted: {
    borderLeft: `4px solid ${theme.palette.secondary.light}8c`,
  },
  verticalLineFirstComment: {
    marginTop: 20, // Match the margin-top from thread item
  },
  verticalLineLastComment: {
    marginBottom: 8, // Match the margin-bottom from thread item
  },
}));


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
  displayStatus: "expanded" | "collapsed" | "hidden";
  onChangeDisplayStatus: (newStatus: "expanded" | "collapsed" | "hidden") => void;
  showInLineCommentThreadTitle?: boolean;
  highlight?: boolean;
  isFirstComment?: boolean;
  isLastComment?: boolean;
  onPostTitleClick?: () => void;
}

const UltraFeedCommentItem = ({
  comment,
  displayStatus,
  onChangeDisplayStatus,
  showInLineCommentThreadTitle,
  highlight = false,
  isFirstComment = false,
  isLastComment = false,
  onPostTitleClick,
}: UltraFeedCommentItemProps) => {
  const classes = useStyles(styles);
  const { UltraFeedCommentsItemMeta, FeedContentBody, UltraFeedItemFooter } = Components;
  const { settings } = useUltraFeedSettings();

  // Get functions from the context
  const { observe, trackExpansion } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { post } = comment;

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, {
        documentId: comment._id,
        documentType: 'comment',
        postId: comment.postId
      });
    }
  }, [observe, comment._id, comment.postId]);

  const handleContentExpand = useCallback((level: number, maxReached: boolean, wordCount: number) => {
    // Log the expansion event
    trackExpansion({
      documentId: comment._id,
      documentType: 'comment',
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

  // Determine breakpoints based on expansion status
  const truncationBreakpoints = useMemo(() => {
    const fullBreakpoints = settings.commentTruncationBreakpoints || []; // Default to empty array if undefined
    const collapsedLimit = settings.collapsedCommentTruncation;

  if (!post) {
    console.log("Missing post data:", comment._id);
    return null;
  }

    if (expanded) {
      // If the item is already expanded, use the standard breakpoints
      return fullBreakpoints;
    } else {
      // If collapsed, use the collapsed limit as the first breakpoint,
      // followed by the rest of the standard breakpoints (skipping the first standard one).
      // Ensure fullBreakpoints has elements before slicing.
      const subsequentBreakpoints = fullBreakpoints.length > 1 ? fullBreakpoints.slice(1) : [];
      return [collapsedLimit, ...subsequentBreakpoints];
    }
  }, [expanded, settings.commentTruncationBreakpoints, settings.collapsedCommentTruncation]);

  const shouldUseLineClamp = !expanded && settings.lineClampNumberOfLines > 0;

  const shouldShowInlineTitle = showInLineCommentThreadTitle && (settings.commentTitleStyle === "commentReplyStyleBeneathMetaInfo" || settings.commentTitleStyle === "commentReplyStyleAboveMetaInfo");
  const titleAboveMetaInfo = shouldShowInlineTitle && (settings.commentTitleStyle === "commentReplyStyleAboveMetaInfo");

  return (
    <div ref={elementRef} className={classNames(classes.root)} >
      <div className={classes.verticalLineContainer}>
        <div className={classNames(
          classes.verticalLine,
          { 
            [classes.verticalLineHighlighted]: highlight,
            [classes.verticalLineFirstComment]: isFirstComment,
            [classes.verticalLineLastComment]: isLastComment
          }
        )} />
      </div>
      
      <div className={classNames(classes.commentContentWrapper, { [classes.commentContentWrapperWithBorder]: !isLastComment })}>
        {titleAboveMetaInfo && post && (
          <div className={classes.inlineCommentThreadTitleAbove}>
            <button 
              className={classes.inlineCommentThreadTitleLink}
              onClick={onPostTitleClick}
            >
              Replying to <span>{post.title}</span>
            </button>
          </div>
        )}
        <div className={classes.commentHeader}>
          <UltraFeedCommentsItemMeta comment={comment} />
          {shouldShowInlineTitle && !titleAboveMetaInfo && !comment.shortform && post && (
            <div className={classes.inlineCommentThreadTitle}>
              <button 
                className={classes.inlineCommentThreadTitleLink}
                onClick={onPostTitleClick}
              >
                Replying to <span>{post.title}</span>
              </button>
            </div>
          )}
        </div>
        <div className={classes.contentWrapper}>
          <FeedContentBody
            comment={comment}
            html={comment.contents?.html || ""}
            breakpoints={truncationBreakpoints || []}
            wordCount={comment.contents?.wordCount || 0}
            linkToDocumentOnFinalExpand={expanded}
            initialExpansionLevel={0}
            nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get()}
            clampOverride={shouldUseLineClamp ? settings.lineClampNumberOfLines : undefined}
            onExpand={handleContentExpand}
          />
        </div>
        <UltraFeedItemFooter document={comment} collectionName="Comments" />
      </div>
    </div>
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
