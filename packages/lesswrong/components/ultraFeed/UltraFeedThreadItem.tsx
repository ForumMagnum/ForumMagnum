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
    paddingBottom: 8,
    borderRadius: 4,
    // paddingTop: 16,
    backgroundColor: theme.palette.panelBackground.default,
    
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
    // borderTop: theme.palette.border.itemSeparatorFeedTop,
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
function compressCollapsedComments(
  displayStatuses: Record<string, "expanded" | "collapsed" | "hidden">,
  comments: CommentsList[],
) {
  const result: Array<CommentsList | { placeholder: true; hiddenComments: CommentsList[] }> = [];

  // If there are no comments, return empty array
  if (comments.length === 0) return result;

  // Always add the first comment without compression
  if (comments.length > 0) {
    result.push(comments[0]);
  }

  // Start from the second comment for compression
  let tempGroup: CommentsList[] = [];

  const flushGroupIfNeeded = () => {
    if (tempGroup.length >= 2) {
      // Make a placeholder containing the group
      result.push({ placeholder: true, hiddenComments: [...tempGroup] });
    } else {
      // Push them back as individual comments
      tempGroup.forEach(item => result.push(item));
    }
    tempGroup = [];
  };

  // Process only comments after the first one
  for (let i = 1; i < comments.length; i++) {
    const comment = comments[i];
    const commentId = comment._id;
    const localStatus = displayStatuses[commentId] || "collapsed"

    // If "hidden", do not display at all, skip it
    if (localStatus === "hidden") {
      continue;
    }

    if (localStatus === "collapsed") {
      // Accumulate collapsed
      tempGroup.push(comment);
    } else {
      // If we hit a non-collapsed, flush the current group
      flushGroupIfNeeded();
      result.push(comment);
    }
  }
  // Flush at the end
  flushGroupIfNeeded();

  return result;
}

// Main component definition
const UltraFeedThreadItem = ({thread}: {
  thread: DisplayFeedPostWithComments,
}) => {
  const { post, comments, postMetaInfo, commentMetaInfos } = thread;

  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const [postExpanded, setPostExpanded] = useState(postMetaInfo.displayStatus === 'expanded');

  // 1) Store each comment's displayStatus locally
  const [commentDisplayStatuses, setCommentDisplayStatuses] = useState<Record<string, "expanded" | "collapsed" | "hidden">>(() => {
    // Initialize from commentMetaInfos if available
    const result: Record<string, "expanded" | "collapsed" | "hidden"> = {};
    
    for (const [commentId, meta] of Object.entries(commentMetaInfos || {})) {
      // For the first comment, ensure it's at least "collapsed"
      if (comments.length > 0 && commentId === comments[0]._id) {
        // If it was set to "hidden", upgrade it to "collapsed"
        const firstCommentStatus = meta.displayStatus === "hidden" ? "collapsed" : meta.displayStatus || "collapsed";
        result[commentId] = firstCommentStatus;
      } else {
        result[commentId] = meta.displayStatus || "collapsed";
      }
    }

    // If the first comment somehow wasn't included in the loop above, ensure it's set
    if (comments.length > 0 && !result[comments[0]._id]) {
      result[comments[0]._id] = "collapsed";
    }

    return result;
  });

  console.log("commentDisplayStatuses", commentDisplayStatuses);

  const { UltraFeedCommentItem, UltraFeedPostItem, UltraFeedCompressedCommentsItem } = Components;


  // Get basic thread statistics
  const commentCount = comments.length;
  const topLevelCommentId = comments?.[0]?._id;
  
  // Extract post information
  const postTitle = post.title || "Untitled Post";
  const postUrl = `/posts/${post._id}`;

  // 2) Function to update a single comment's status
  const setDisplayStatus = (commentId: string, newStatus: "expanded" | "collapsed" | "hidden") => {
    setCommentDisplayStatuses(prev => ({
      ...prev,
      [commentId]: newStatus,
    }));
  };

  // Filter out hidden comments from the start
  const visibleComments = useMemo(
    () => comments.filter(c => commentDisplayStatuses[c._id] !== "hidden"),
    [comments, commentDisplayStatuses]
  );

  // 3) Compress consecutive collapsed items
  const compressedItems = useMemo(() => {
    return compressCollapsedComments(commentDisplayStatuses, visibleComments);
  }, [visibleComments, commentDisplayStatuses]);

  const titleClickHandler = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    setPostExpanded(!postExpanded);
  }

  const showInLineCommentThreadTitle = true
      
  const titleElement = 
  showInLineCommentThreadTitle ? undefined : (
    <div className={classes.header}>
      <div className={classes.titleArea}>
        <Link to={postUrl} className={classes.postTitle} onClick={titleClickHandler}>{postTitle}</Link>
      </div>
    </div>
  );

  const handleViewFullThread = () => {
    if (comments.length > 0) {
      const topLevelCommentId = comments[0]._id;
      captureEvent("ultraFeedThreadViewFull", { threadId: topLevelCommentId });
    }
  };

  const threadUrl = `/posts/${post._id}/${comments[0]?._id}`;

  return (
    <div className={classes.root}>
      {postExpanded ? <UltraFeedPostItem post={thread.post} postMetaInfo={thread.postMetaInfo} initiallyExpanded={false} /> : titleElement}
      {comments.length > 0 && <div className={classes.commentsList}>
        <div className={classes.commentsContainer}>
          {compressedItems.map((item, index) => {
            if ("placeholder" in item) {
              // Multi-comment placeholder
              const hiddenCount = item.hiddenComments.length;
              return (
                <div className={classes.commentItem} key={`placeholder-${index}`}>
                  <UltraFeedCompressedCommentsItem
                    numComments={hiddenCount}
                    setExpanded={() => {
                      // Expand all comments in this placeholder
                      item.hiddenComments.forEach(h => {
                        setDisplayStatus(h._id, "expanded");
                      });
                    }}
                  />
                </div>
              );
            } else {
              // Normal comment
              const cId = item._id;
              return (
                <div key={cId} className={classes.commentItem}>
                  <UltraFeedCommentItem
                    comment={item}
                    post={thread.post}
                    displayStatus={commentDisplayStatuses[cId]}
                    onChangeDisplayStatus={(newStatus) => setDisplayStatus(cId, newStatus)}
                    showInLineCommentThreadTitle={(index === 0) && showInLineCommentThreadTitle}
                  />
                </div>
              );
            }
          })}
        </div>
        
        {comments.length > visibleComments.length && (
          <div className={classes.viewFullThreadButton} onClick={handleViewFullThread}>
            <Link to={threadUrl} className={classes.viewFullThreadLink}>
              View full thread ({comments.length} comments) →
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