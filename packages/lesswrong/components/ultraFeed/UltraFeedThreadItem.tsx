import React, { useMemo, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { DisplayFeedComment, DisplayFeedCommentThread } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";

// Styles for the UltraFeedThreadItem component
const styles = defineStyles("UltraFeedThreadItem", (theme: ThemeType) => ({
  root: {
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.default,
  },
  titleArea: {
    flexGrow: 1,
  },
  postTitle: {
    marginLeft: 16,
    marginBottom: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    opacity: 0.6,
    lineHeight: 1.15,
    textDecoration: 'none',
    cursor: 'pointer',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
    },
  },
  expandAllButton: {
    cursor: 'pointer',
    opacity: 0.2,
    paddingRight: 4,
    paddingLeft: 4,
    marginRight: -4,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&:hover': {
      opacity: 0.4,
    },
  },
  commentsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative', // Needed for absolute positioning of comment lines
  },
  commentItem: {
    position: 'relative',
    zIndex: 1, // Ensure comments are above the line
  },
  collapsedCommentItem: {
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


// Utility to compress collapsed sequences
function compressCollapsedComments(
  displayStatuses: Record<string, "expanded" | "collapsed" | "hidden">,
  comments: UltraFeedComment[],
) {
  const result: Array<UltraFeedComment | { placeholder: true; hiddenComments: UltraFeedComment[] }> = [];

  // If there are no comments, return empty array
  if (comments.length === 0) return result;

  // Always add the first comment without compression
  if (comments.length > 0) {
    result.push(comments[0]);
  }

  // Start from the second comment for compression
  let tempGroup: UltraFeedComment[] = [];

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
  thread: DisplayFeedCommentThread,
}) => {
  const { comments, commentMetaInfos } = thread;

  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const [postExpanded, setPostExpanded] = useState(false);

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

  // Track which comments are highlighted (for green vertical line)
  const [highlightStatuses, setHighlightStatuses] = useState<Record<string, boolean>>(() => {
    // Initialize highlights only from commentMetaInfos
    const result: Record<string, boolean> = {};
    
    for (const [commentId, _] of Object.entries(commentDisplayStatuses)) {
      const metaInfo = commentMetaInfos[commentId];
      
      // Use the highlight value from metadata if available
      result[commentId] = metaInfo?.highlight || false;
    }
    
    return result;
  });

  const { UltraFeedCommentItem, UltraFeedCompressedCommentsItem } = Components;

  // 2) Function to update a single comment's status
  const setDisplayStatus = (commentId: string, newStatus: "expanded" | "collapsed" | "hidden") => {
    setCommentDisplayStatuses(prev => ({
      ...prev,
      [commentId]: newStatus,
    }));
    
    // We no longer modify highlight status here - it's determined by the server
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

  const postTitleClickHandler = () => {
    setPostExpanded(true);
  }

  return (
    <div className={classes.root}>
      {comments.length > 0 && <div className={classes.commentsContainer}>
        <div className={classes.commentsList}>
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
                  isFirstComment={index === 0}
                  isLastComment={index === compressedItems.length - 1}
                />
              </div>
            );
          } else {
            // Normal comment
            const cId = item._id;
            const isFirstItem = index === 0;
            const isLastItem = index === compressedItems.length - 1;
            
            return (
              <div key={cId} className={classes.commentItem}>
                <UltraFeedCommentItem
                  comment={item}
                  displayStatus={commentDisplayStatuses[cId]}
                  onChangeDisplayStatus={(newStatus) => setDisplayStatus(cId, newStatus)}
                  showInLineCommentThreadTitle={isFirstItem}
                  highlight={highlightStatuses[cId] || false}
                  isFirstComment={isFirstItem}
                  isLastComment={isLastItem}
                  onPostTitleClick={postTitleClickHandler}
                />
              </div>
            );
          }
          })}
        </div>
      </div>}
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
