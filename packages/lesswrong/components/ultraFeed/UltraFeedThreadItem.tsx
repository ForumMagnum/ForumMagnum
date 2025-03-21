import React, { useMemo, useState } from "react";
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
    // padding: 12,
    paddingTop: 16,
    paddingBottom: 8,

    // marginBottom: 16,
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 4,
    
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
    marginBottom: 12,
    marginLeft: 2,
    // textAlign: 'right',
  },
  titleArea: {
    flexGrow: 1,
  },
  postTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    opacity: 0.6,
    lineHeight: 1.15,

    lineWrap: 'balance',
    textWrap: 'balance',
    textDecoration: 'none',
    cursor: 'pointer',

    paddingBottom: 4,
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
    
    borderTop: theme.palette.border.itemSeparatorFeedTop,
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
      borderBottom: theme.palette.border.itemSeparatorBottom,
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

interface CollapsedPlaceholder {
  placeholder: true;
  hiddenComments: DisplayFeedComment[];
}

// Utility to compress collapsed sequences
const compressCollapsedComments = (
  comments: DisplayFeedComment[]
): Array<DisplayFeedComment | CollapsedPlaceholder> => {
  const result: Array<DisplayFeedComment | CollapsedPlaceholder> = [];
  let tempGroup: DisplayFeedComment[] = [];

  const flushGroupIfNeeded = () => {
    if (tempGroup.length >= 2) {
      // Make a placeholder containing the group
      result.push({ placeholder: true, hiddenComments: [...tempGroup] });
    } else {
      // Just push them back as individual comments
      tempGroup.forEach(item => result.push(item));
    }
    tempGroup = [];
  };

  for (const comment of comments) {
    if (comment.metaInfo.displayStatus === "collapsed") {
      // Accumulate collapsed
      tempGroup.push(comment);
    } else {
      // If we hit a non-collapsed, flush current group first
      flushGroupIfNeeded();
      result.push(comment);
    }
  }
  // Flush any leftover collapsed items
  flushGroupIfNeeded();

  return result;
}

// Main component definition
const UltraFeedThreadItem = ({thread}: {
  thread: DisplayFeedPostWithComments,
}) => {
  const { post, comments, postMetaInfo } = thread;

  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const [postExpanded, setPostExpanded] = useState(postMetaInfo.displayStatus === 'expanded');
  const [allCommentsExpanded, setAllCommentsExpanded] = useState<boolean | undefined>(undefined);


  const { UltraFeedCommentItem, UltraFeedPostItem, UltraFeedCompressedCommentsItem } = Components;


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
  const handleExpandAllComments = (e: React.MouseEvent) => {
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
          onClick={handleExpandAllComments}
        >
          {allCommentsExpanded ? <UnfoldLessDoubleIcon /> : <UnfoldMoreDoubleIcon />}
        </div>
      )}
    </div>
  );

  // Instead of using visibleComments directly, compress them before rendering:
  const compressedItems = useMemo(() => {
    return compressCollapsedComments(visibleComments);
  }, [visibleComments]);

  // Track any placeholders that got expanded
  const [expandedPlaceholders, setExpandedPlaceholders] = useState<{
    [placeholderIndex: number]: boolean;
  }>({});

  // Handler to expand a placeholder
  const handleExpandPlaceholder = (idx: number) => {
    setExpandedPlaceholders({
      ...expandedPlaceholders,
      [idx]: true,
    });
  };

  return (
    <div className={classes.root}>
      {postExpanded ? <UltraFeedPostItem post={thread.post} initiallyExpanded={false} /> : titleElement}
      {commentCount > 0 && <div className={classes.commentsList}>
        <div className={classes.commentsContainer}>
          {/* {visibleComments.length > 1 && <div className={classes.verticalLine}></div>} */}
          
          {compressedItems.map((item, index) => {
            if ("placeholder" in item) {
              // It's our "multicomment placeholder"
              const hiddenCount = item.hiddenComments.length;
              const isExpanded = expandedPlaceholders[index];
              if (isExpanded) {
                // Show the previously hidden comments
                return item.hiddenComments.map((hiddenItem) => (
                  <div key={hiddenItem.comment._id} className={classes.commentItem}>
                    <UltraFeedCommentItem
                      commentWithMetaInfo={hiddenItem}
                      post={thread.post}
                      forceExpand={undefined}
                    />
                  </div>
                ));
              } else {
                // Show a single row with a "+" link
                return (
                  // <div
                  //   key={`placeholder-${index}`}
                  //   className={classes.commentItem}
                  //   onClick={() => handleExpandPlaceholder(index)}
                  //   style={{ cursor: "pointer", opacity: 0.6 }}
                  // >
                  //   +{hiddenCount} collapsed comments
                  // </div>
                  <div className={classes.commentItem} key={`placeholder-${index}`}>
                    <UltraFeedCompressedCommentsItem 
                      numComments={hiddenCount} 
                      setExpanded={() => handleExpandPlaceholder(index)} 
                    />
                  </div>
                );
              }
            } else {
              // Normal (non-collapsed or single collapsed) item
              return (
                <div key={item.comment._id} className={classes.commentItem}>
                  <UltraFeedCommentItem 
                    commentWithMetaInfo={item} 
                    post={thread.post} 
                    forceExpand={undefined} 
                  />
                </div>
              );
            }
          })}
        </div>
        
        {commentCount > visibleComments.length && (
          <div className={classes.viewFullThreadButton} onClick={handleViewFullThread}>
            <Link to={threadUrl} className={classes.viewFullThreadLink}>
              View full thread ({commentCount} comments) →
            </Link>
          </div>
        )}
      </div>
      }
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