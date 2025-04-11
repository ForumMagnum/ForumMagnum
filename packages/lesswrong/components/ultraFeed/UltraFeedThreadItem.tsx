import React, { useMemo, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DisplayFeedCommentThread, FeedCommentMetaInfo } from "./ultraFeedTypes";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";

const styles = defineStyles("UltraFeedThreadItem", (theme: ThemeType) => ({
  root: {
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.default,
  },
  commentsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  commentItem: {
    position: 'relative',
  },
}));

type CommentDisplayStatusMap = Record<string, "expanded" | "collapsed" | "hidden">;

/* if there are multiple comments in a row that are collapsed, compress them into a single placeholder */
function compressCollapsedComments(
  displayStatuses: CommentDisplayStatusMap,
  comments: UltraFeedComment[],
) {
  const result: Array<UltraFeedComment | { placeholder: true; hiddenComments: UltraFeedComment[] }> = [];

  if (comments.length === 0) return result;

  if (comments.length > 0) {
    result.push(comments[0]);
  }

  let tempGroup: UltraFeedComment[] = [];

  const flushGroupIfNeeded = () => {
    if (tempGroup.length >= 2) {
      result.push({ placeholder: true, hiddenComments: [...tempGroup] });
    } else {
      tempGroup.forEach(item => result.push(item));
    }
    tempGroup = [];
  };

  for (let i = 1; i < comments.length; i++) {
    const comment = comments[i];
    const commentId = comment._id;
    const localStatus = displayStatuses[commentId] || "collapsed"

    if (localStatus === "hidden") {
      continue;
    }

    if (localStatus === "collapsed") {
      tempGroup.push(comment);
    } else {
      // If we hit a non-collapsed, flush the current group
      flushGroupIfNeeded();
      result.push(comment);
    }
  }
  flushGroupIfNeeded();

  return result;
}

const UltraFeedThreadItem = ({thread, index, settings = DEFAULT_SETTINGS}: {
  thread: DisplayFeedCommentThread,
  index: number,
  settings?: UltraFeedSettingsType,
}) => {
  const { comments, commentMetaInfos } = thread;

  const classes = useStyles(styles);
  const {captureEvent} = useTracking();

  const calculateInitialDisplayStatuses = (
    metaInfos: Record<string, FeedCommentMetaInfo> | undefined
  ): CommentDisplayStatusMap => {
    const result: CommentDisplayStatusMap = {};
    for (const [commentId, meta] of Object.entries(metaInfos ?? {})) {
      // For the first comment, ensure it's at least "collapsed"
      if (comments.length > 0 && commentId === comments[0]._id) {
        const firstCommentStatus = meta.displayStatus === "hidden"
        ? "collapsed"
        : meta.displayStatus ?? "collapsed";
        result[commentId] = firstCommentStatus;
      } else {
        result[commentId] = meta.displayStatus ?? "collapsed"; 
      }
    }
    return result;
  };

  const initializeHighlightStatuses = (
    initialDisplayStatuses: CommentDisplayStatusMap,
    metaInfos: Record<string, FeedCommentMetaInfo> | undefined
  ): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    for (const commentId of Object.keys(initialDisplayStatuses)) {
      const metaInfo = metaInfos?.[commentId]; // Safely access metaInfos
      result[commentId] = metaInfo?.highlight ?? false; // Use ?? nullish coalescing
    }
    return result;
  };

  const initialDisplayStatuses = calculateInitialDisplayStatuses(commentMetaInfos);
  const initialHighlightStatuses = initializeHighlightStatuses(initialDisplayStatuses, commentMetaInfos);

  // Use the pre-calculated initial states
  const [commentDisplayStatuses, setCommentDisplayStatuses] = useState<CommentDisplayStatusMap>(initialDisplayStatuses);
  const [highlightStatuses] = useState<Record<string, boolean>>(initialHighlightStatuses);

  const { UltraFeedCommentItem, UltraFeedCompressedCommentsItem } = Components;

  const setDisplayStatus = (commentId: string, newStatus: "expanded" | "collapsed" | "hidden") => {
    setCommentDisplayStatuses(prev => ({
      ...prev,
      [commentId]: newStatus,
    }));
  };

  const visibleComments = useMemo(
    () => comments.filter(c => commentDisplayStatuses[c._id] !== "hidden"),
    [comments, commentDisplayStatuses]
  );

  const compressedItems = useMemo(() => {
    return compressCollapsedComments(commentDisplayStatuses, visibleComments);
  }, [visibleComments, commentDisplayStatuses]);

  return (
    <AnalyticsContext pageSubSectionContext="ultraFeedThread" ultraFeedCardId={thread._id} ultraFeedCardIndex={index}>
      <div className={classes.root}>
        {comments.length > 0 && <div className={classes.commentsContainer}>
          <div className={classes.commentsList}>
          {compressedItems.map((item, index) => {
            if ("placeholder" in item) {
              const hiddenCount = item.hiddenComments.length;
              return (
                <div className={classes.commentItem} key={`placeholder-${index}`}>
                <UltraFeedCompressedCommentsItem
                  numComments={hiddenCount}
                  setExpanded={() => {
                    captureEvent("ultraFeedThreadItemCompressedCommentsExpanded", { ultraCardIndex: index, ultraCardCount: compressedItems.length, });
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
                  settings={settings}
                />
              </div>
            );
          }
          })}
        </div>
      </div>}
    </div>
    </AnalyticsContext>
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
