import React, { useCallback, useState, useMemo } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import { isLWorAF } from "../../lib/instanceSettings";
import classNames from "classnames";
import { DisplayFeedComment } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";

// Styles for the UltraFeedCommentItem component
const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  root: {
    position: "relative",
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.default,
    // marginBottom: 4,
  },
  hidden: {
    display: 'none',
  },
  // Styles for the collapsed comment based on SingleLineComment

  // Styles for expanded comment
  commentHeader: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",
    marginRight: isFriendlyUI ? 40 : 20,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.2rem',
    rowGap: "6px",
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: isFriendlyUI ? undefined : `${theme.palette.linkHover.dim} !important`,
    },
  },
  contentWrapper: {
    cursor: "pointer",
  },
  content: {
  },
  truncatedContent: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 6,
    '& blockquote, & br, & figure, & img': {
      display: 'none'
    }
  },
  replyLink: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginRight: 8,
    display: "inline",
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    cursor: "pointer",
  },
  commentBottom: {
    // marginBottom: 4,
  },
  voteContainer: {
    marginLeft: 10,
  },
}));



// Main component definition
const UltraFeedCommentItem = ({
  commentWithMetaInfo,
  post
}: {
  commentWithMetaInfo: DisplayFeedComment,
  post: PostsMinimumInfo,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const { UltraFeedCollapsedCommentItem, UltraFeedCommentsItemMeta, ContentStyles, CommentBottom } = Components;

  const { comment, metaInfo } = commentWithMetaInfo;

  const initialExpanded = metaInfo.displayStatus === "expanded";
  
  // Calculate if content should be truncated (over 500 words)
  const shouldTruncate = useMemo(() => {
    return ((comment.contents?.wordCount ?? 0 > 500) && metaInfo.displayStatus === 'collapsed') || (metaInfo.displayStatus === 'expanded');
  }, [metaInfo.displayStatus, comment.contents?.wordCount]);

  const [expanded, setExpanded] = useState(initialExpanded);
  const [contentTruncated, setContentTruncated] = useState(shouldTruncate);
  const [showEditState, setShowEditState] = useState(false);

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);

  const handleContentClick = useCallback(() => {
    setContentTruncated(false);
  }, []);

  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "ultraFeedCommentExpanded" : "ultraFeedCommentCollapsed");
  }, [captureEvent, setExpanded]);

  // We're doing both a NoSSR + conditional `display: 'none'` to toggle between the collapsed & expanded quick take
  // This is to eliminate a loading spinner (for the child comments) when someone expands a quick take,
  // while avoiding the impact to the home page SSR speed for the large % of users who won't interact with quick takes at all

  // TODO: this is a hacky fix to avoid having Answer styling muck with everything
  const modifiedComment = { comment: { ...comment, answer: false }, metaInfo };

  const showInlineCancel = showEditState;
  const replyButton = <a
  className={classNames("comments-item-reply-link", classes.replyLink)}
  // onClick={showInlineCancel ? closeReplyForm : openReplyForm}
>
  {/* TODO: reconsider later */}
  {showInlineCancel ? "Cancel" : "Reply"}
</a>



  const commentBottom = (
    <CommentBottom
      comment={comment}
      post={post}
      treeOptions={{}}
      votingSystem={votingSystem}
      voteProps={voteProps}
      replyButton={replyButton}
    />
  )

  const collapsedComment = (
    <div className={classNames({ [classes.hidden]: expanded })}>
      <UltraFeedCollapsedCommentItem 
        commentWithMetaInfo={modifiedComment} 
        post={post} 
        setExpanded={wrappedSetExpanded} 
      />
    </div>
  );

  const expandedComment = (
    <div className={classNames(classes.root, { [classes.hidden]: !expanded })}>
      <UltraFeedCommentsItemMeta 
        commentWithMetaInfo={modifiedComment}
        post={post}
        setShowEdit={() => setShowEditState(true)}
        hideActionsMenu={false}
      />
      <div className={classes.contentWrapper} onClick={contentTruncated ? handleContentClick : undefined} >
        <ContentStyles 
          contentType="comment" 
          className={classNames(
            classes.content,
            contentTruncated && classes.truncatedContent
          )}
        >
          <div dangerouslySetInnerHTML={{ __html: comment.contents?.html || '' }} />
        </ContentStyles>
      </div>
      <div className={classes.commentBottom}>
        {commentBottom}
      </div>
    </div>
  );

  return <>
    {collapsedComment}
    {expandedComment}
  </>;
};

const UltraFeedCommentItemComponent = registerComponent("UltraFeedCommentItem", UltraFeedCommentItem);

export default UltraFeedCommentItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentItem: typeof UltraFeedCommentItemComponent
  }
}
