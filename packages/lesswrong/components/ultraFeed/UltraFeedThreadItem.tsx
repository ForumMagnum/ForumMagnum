import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { DisplayFeedComment, DisplayFeedPostWithComments } from "./ultraFeedTypes";
import classNames from "classnames";
import { Link } from "../../lib/reactRouterWrapper";
import { defineStyles, useStyles } from "../hooks/useStyles";
import UnfoldMoreDoubleIcon from "@/lib/vendor/@material-ui/icons/src/UnfoldMoreDouble";
import UnfoldLessDoubleIcon from "@/lib/vendor/@material-ui/icons/src/UnfoldLessDouble";

// Styles for the UltraFeedThreadItem component
const styles = defineStyles("UltraFeedThreadItem", (theme: ThemeType) => ({
  root: {
    position: "relative",
    padding: 12,
    // marginBottom: 16,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
    
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginLeft: 2,
    // textAlign: 'right',
  },
  titleArea: {
    flexGrow: 1,
  },
  postTitle: {
    cursor: 'pointer',
    // marginLeft: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.1rem',
    fontWeight: 500,
    opacity: 0.6,
    lineHeight: 1.1,
    // color: theme.palette.primary.main,
    lineWrap: 'balance',
    textWrap: 'balance',
    textDecoration: 'none',
    // textAlign: 'right',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
    },
  },
  expandAllButton: {
    cursor: 'pointer',
    opacity: 0.2,
    // fontSize: 1,
    paddingRight: 4,
    paddingLeft: 4,
    marginRight: -4,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&:hover': {
      opacity: 0.4,
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
    display: 'none',
  },
  commentItem: {
    position: 'relative',
    zIndex: 1, // Ensure comments are above the line
    '&:not(:last-child)': {
      marginBottom: 2,
    },
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
  thread: DisplayFeedPostWithComments,
}) => {
  const { post, comments, postMetaInfo } = thread;

  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const [postExpanded, setPostExpanded] = useState(postMetaInfo.displayStatus === 'expanded');
  const [allCommentsExpanded, setAllCommentsExpanded] = useState(false);


  const { UltraFeedCommentItem, UltraFeedPostItem } = Components;


  // Get basic thread statistics
  const commentCount = comments.length;
  const topLevelCommentId = comments?.[0]?.comment?._id;
  
  // Extract post information
  const postTitle = post.title || "Untitled Post";
  const postUrl = `/posts/${post._id}`;
  const threadUrl = `/posts/${post._id}/${topLevelCommentId}`;

  // Handle click on "View Full Thread" button
  const handleViewFullThread = () => {
    captureEvent("ultraFeedThreadViewFull", {threadId: topLevelCommentId});
  };
  
  // Handle click on "Expand All" button
  // TODO: Once we've implemented hidden comments, ensure we expand them too?
  const handleExpandAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAllCommentsExpanded(!allCommentsExpanded);
    captureEvent("ultraFeedThreadExpandAll", {
      threadId: topLevelCommentId,
      expanded: !allCommentsExpanded
    });
  };

  // Filter comments by display status - only show non-hidden comments
  const visibleComments = thread.comments.filter(
    comment => comment.metaInfo.displayStatus !== "hidden"
  );

  const titleClickHandler = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    setPostExpanded(!postExpanded);
  }
      
  const titleElement = (
    <div className={classes.header}>
      <div className={classes.titleArea}>
        <Link to={postUrl} className={classes.postTitle} onClick={titleClickHandler}>{postTitle}</Link>
      </div>
      {commentCount > 1 && (
        <div 
          className={classes.expandAllButton} 
          onClick={handleExpandAll}
        >
          {allCommentsExpanded ? <UnfoldLessDoubleIcon /> : <UnfoldMoreDoubleIcon />}
        </div>
      )}
    </div>
  );

  return (
    <div className={classes.root}>
      {postExpanded ? <UltraFeedPostItem post={thread.post} initiallyExpanded={true} /> : titleElement}
      <div className={classes.commentsList}>
        <div className={classes.commentsContainer}>
          {/* {visibleComments.length > 1 && <div className={classes.verticalLine}></div>} */}
          
          {visibleComments.map((item: DisplayFeedComment, index: number) => (
            <div 
              key={item.comment._id} 
              className={classes.commentItem}
            >
              <UltraFeedCommentItem 
                commentWithMetaInfo={item} 
                post={thread.post} 
                forceExpand={allCommentsExpanded}
              />
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