import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { DisplayFeedComment, DisplayFeedCommentThread } from "./ultraFeedTypes";
import classNames from "classnames";
import { Link } from "../../lib/reactRouterWrapper";
import { defineStyles, useStyles } from "../hooks/useStyles";

// Styles for the UltraFeedThreadItem component
const styles = defineStyles("UltraFeedThreadItem", (theme: ThemeType) => ({
  root: {
    position: "relative",
    marginBottom: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
    marginRight: 4
  },
  postTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.2rem',
    fontWeight: 500,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  commentsList: {
    position: 'relative',
  },
  commentsContainer: {
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    left: '50%', // Position at 30% of the width for better visual centering
    top: 0,
    bottom: 12,  // Match marginBottom of the last comment
    width: 3,
    backgroundColor: theme.palette.grey[400],
    zIndex: 0, // Ensure it's behind comments
  },
  commentItem: {
    marginBottom: 4,
    position: 'relative',
    zIndex: 1, // Ensure comments are above the line
  },
  indentedCommentItem: {
    marginBottom: 4,
    position: 'relative',
    paddingLeft: 16, // Indent subsequent comments
    zIndex: 1, // Ensure comments are above the line
  },
  viewFullThreadButton: {
    marginTop: 12,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  viewFullThreadLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

// Main component definition
const UltraFeedThreadItem = ({thread}: {
  thread: DisplayFeedCommentThread,
}) => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const { UltraFeedCommentItem } = Components;

  // Get basic thread statistics
  const commentCount = thread.comments.length;
  
  // Extract post information
  const postTitle = thread.post.title || "Untitled Post";
  const postUrl = `/posts/${thread.post._id}`;
  const threadUrl = `/posts/${thread.post._id}/${thread.topLevelCommentId}`;

  // Handle click on "View Full Thread" button
  const handleViewFullThread = () => {
    captureEvent("ultraFeedThreadViewFull", {threadId: thread.topLevelCommentId});
  };

  // Filter comments by display status - only show non-hidden comments
  const visibleComments = thread.comments.filter(
    comment => comment.displayStatus !== "hidden"
  );

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Link to={postUrl} className={classes.postTitle}>{postTitle}</Link>
      </div>
      
      <div className={classes.commentsList}>
        <div className={classes.commentsContainer}>
          {visibleComments.length > 1 && <div className={classes.verticalLine}></div>}
          
          {visibleComments.map((comment: DisplayFeedComment, index: number) => (
            <div 
              key={comment.commentId} 
              className={index === 0 ? classes.commentItem : classes.indentedCommentItem}
            >
              <UltraFeedCommentItem comment={comment} />
            </div>
          ))}
        </div>
        
        {commentCount > visibleComments.length && (
          <div className={classes.viewFullThreadButton} onClick={handleViewFullThread}>
            <Link to={threadUrl} className={classes.viewFullThreadLink}>
              View full thread ({commentCount} comments) →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const UltraFeedThreadItemComponent = registerComponent(
  "UltraFeedThreadItem",
  UltraFeedThreadItem,
);

export default UltraFeedThreadItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedThreadItem: typeof UltraFeedThreadItemComponent
  }
}
