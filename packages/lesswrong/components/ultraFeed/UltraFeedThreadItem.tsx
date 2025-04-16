import React, { useMemo, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DisplayFeedCommentThread, FeedCommentMetaInfo, FeedItemDisplayStatus } from "./ultraFeedTypes";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useSingle } from "@/lib/crud/withSingle";


const itemSeparator = (theme: ThemeType) => ({
  content: '""',
  position: 'absolute',
  bottom: 0,
  left: 16,
  right: 16,
  height: 2,
  backgroundColor: theme.palette.greyAlpha(0.05)
})

const styles = defineStyles("UltraFeedThreadItem", (theme: ThemeType) => ({
  commentsRoot: {
    paddingLeft: 20,
    paddingRight: 16,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.default,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 16,
    },
  },
  commentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: "16px",
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  commentItem: {
    position: 'relative',
  },

  postsLoadingContainer: {
    backgroundColor: theme.palette.panelBackground.default,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    '&::after': itemSeparator(theme),
  },
  postContainer: {
    // bottom border with margins to mimic separation between comments
    position: 'relative',
    '&::after': itemSeparator(theme),
  }
}));

type CommentDisplayStatusMap = Record<string, "expanded" | "collapsed" | "hidden">;

/* if there are multiple comments in a row that are collapsed, compress them into a single placeholder */
const compressCollapsedComments = (
  displayStatuses: CommentDisplayStatusMap,
  comments: UltraFeedComment[],
) => {
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

const calculateInitialDisplayStatuses = (
  comments: UltraFeedComment[],
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

const UltraFeedThreadItem = ({thread, index, settings = DEFAULT_SETTINGS}: {
  thread: DisplayFeedCommentThread,
  index: number,
  settings?: UltraFeedSettingsType,
}) => {
  const classes = useStyles(styles);
  
  const { comments, commentMetaInfos } = thread;
  const {captureEvent} = useTracking();
  const [ postExpanded, setPostExpanded ] = useState(false);

  const { document: post, loading } = useSingle({
    documentId: comments[0].postId,
    collectionName: 'Posts',
    fragmentName: 'UltraFeedPostFragment',
    skip: !comments[0].postId || !postExpanded,
  });

  const postMetaInfo = {
    sources: commentMetaInfos?.[comments[0]._id]?.sources ?? [],
    displayStatus: "expanded" as FeedItemDisplayStatus
  }

  const initialDisplayStatuses = calculateInitialDisplayStatuses(comments, commentMetaInfos);
  const initialHighlightStatuses = initializeHighlightStatuses(initialDisplayStatuses, commentMetaInfos);
  const [commentDisplayStatuses, setCommentDisplayStatuses] = useState<CommentDisplayStatusMap>(initialDisplayStatuses);
  const [highlightStatuses] = useState<Record<string, boolean>>(initialHighlightStatuses);

  const { UltraFeedCommentItem, UltraFeedCompressedCommentsItem, UltraFeedPostItem, Loading } = Components;

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
    {postExpanded && !post && loading && <div className={classes.postsLoadingContainer}>
      <Loading />
    </div>}
    {postExpanded && post && <div className={classes.postContainer}>
      <UltraFeedPostItem post={post} index={index} postMetaInfo={postMetaInfo} />
    </div>}
    <div className={classes.commentsRoot}>
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
                    metaInfo={commentMetaInfos?.[cId]}
                    onPostTitleClick={() => setPostExpanded(true)}
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
