import React, { useCallback, useState, useMemo, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { DisplayFeedComment } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";
import { Link } from "@/lib/reactRouterWrapper";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { useUltraFeedSettings } from "../../lib/ultraFeedSettings";


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
    marginTop: -18,
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
      <div className={classes.verticalLineContainer}>
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
  comment: CommentsList;
  post: PostsListWithVotes;
  displayStatus: "expanded" | "collapsed" | "hidden";
  onChangeDisplayStatus: (newStatus: "expanded" | "collapsed" | "hidden") => void;
  showInLineCommentThreadTitle?: boolean;
  highlight?: boolean;
  isFirstComment?: boolean;
  isLastComment?: boolean;
  onPostTitleClick?: () => void;
}

interface CollapsedPlaceholder {
  placeholder: true;
  hiddenComments: DisplayFeedComment[];
}

const UltraFeedCommentItem = ({
  comment,
  post,
  displayStatus,
  onChangeDisplayStatus,
  showInLineCommentThreadTitle,
  highlight = false,
  isFirstComment = false,
  isLastComment = false,
  onPostTitleClick,
}: UltraFeedCommentItemProps) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();

  const { UltraFeedCommentsItemMeta, CommentBottom, FeedContentBody, UltraFeedCommentItemFooter } = Components;
  const { settings } = useUltraFeedSettings();
  const { commentTruncationBreakpoints, collapsedCommentTruncation, lineClampNumberOfLines, commentTitleStyle } = settings;

  // const votingSystemName = comment.votingSystem || "default";
  // const votingSystem = getVotingSystemByName(votingSystemName);
  // const voteProps = useVote(comment, "Comments", votingSystem);

  // Decide if we should truncate the content if collapsed
  const shouldTruncate = useMemo(() => {
    const wordCount = comment.contents?.wordCount ?? 0;
    return wordCount > 500 && displayStatus !== "expanded";
  }, [displayStatus, comment.contents?.wordCount]);

  const handleExpand = useCallback(() => {
    onChangeDisplayStatus("expanded");
    captureEvent("ultraFeedCommentExpanded");
  }, [onChangeDisplayStatus, captureEvent]);

  const expanded = displayStatus === "expanded";
  const metaDataProps = { hideVoteButtons: true, hideActionsMenu: false, setShowEdit: () => {} }
  
  // Use the truncation breakpoints from settings
  const truncationBreakpoints = displayStatus === "expanded" ? commentTruncationBreakpoints : [collapsedCommentTruncation];
  const shouldUseLineClamp = !expanded && lineClampNumberOfLines > 0;

  // Determine if and how we should show the title
  const shouldShowInlineTitle = showInLineCommentThreadTitle && (commentTitleStyle === "commentReplyStyleBeneathMetaInfo" || commentTitleStyle === "commentReplyStyleAboveMetaInfo");
  const titleAboveMetaInfo = shouldShowInlineTitle && (commentTitleStyle === "commentReplyStyleAboveMetaInfo");

  return (
    <div className={classNames(classes.root)} >
      {/* Vertical line container */}
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
      
      {/* Comment content */}
      <div className={classNames(classes.commentContentWrapper, { [classes.commentContentWrapperWithBorder]: !isLastComment })}>
        {titleAboveMetaInfo && (
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
          <UltraFeedCommentsItemMeta comment={comment} post={post} {...metaDataProps} />
          {shouldShowInlineTitle && !titleAboveMetaInfo && !comment.shortform && (
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
            breakpoints={truncationBreakpoints}
            wordCount={comment.contents?.wordCount || 0}
            linkToDocumentOnFinalExpand={displayStatus === "expanded"}
            initialExpansionLevel={0}
            nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get()}
            clampOverride={shouldUseLineClamp ? settings.lineClampNumberOfLines : undefined}
          />
        </div>
        <UltraFeedCommentItemFooter comment={comment} post={post} />
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
