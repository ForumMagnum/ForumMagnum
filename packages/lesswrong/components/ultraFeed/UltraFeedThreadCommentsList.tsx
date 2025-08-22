import React from "react";
import { UltraFeedCommentItem, UltraFeedCompressedCommentsItem } from "./UltraFeedCommentItem";
import { FeedCommentMetaInfo, FeedItemDisplayStatus } from "./ultraFeedTypes";
import { UltraFeedSettingsType } from "./ultraFeedSettingsTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";

const styles = defineStyles("UltraFeedThreadCommentsList", (theme: ThemeType) => ({
  commentItem: {
    position: 'relative',
    borderBottom: theme.palette.border.itemSeparatorBottom,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  readItem: {
    [theme.breakpoints.down('sm')]: {
      borderLeft: theme.palette.border.readUltraFeedBorder,
      borderRight: theme.palette.border.readUltraFeedBorder,
    },
  },
  readWithReadNext: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  firstItemRead: {
    [theme.breakpoints.down('sm')]: {
      '&:first-child': {
        borderTop: theme.palette.border.readUltraFeedBorder
      },
    },
  },
}));

type CompressedItem = UltraFeedComment | { placeholder: true; hiddenComments: UltraFeedComment[] };

interface NavigationProps {
  showNav: boolean;
  forkParentId: string | null;
  currentBranch: 'new' | 'original';
}

interface UltraFeedThreadCommentsListProps {
  compressedItems: CompressedItem[];
  commentMetaInfos: Record<string, FeedCommentMetaInfo> | undefined;
  commentDisplayStatuses: Record<string, FeedItemDisplayStatus>;
  highlightStatuses: Record<string, boolean>;
  commentAuthorsMap: Record<string, string | null>;
  animatingCommentIds: Set<string>;
  visibleComments: UltraFeedComment[];
  newReplies: Record<string, UltraFeedComment>;
  replyingToCommentId: string | null;
  postInitiallyExpanded: boolean;
  settings: UltraFeedSettingsType;
  threadIndex: number;
  onSetDisplayStatus: (commentId: string, newStatus: FeedItemDisplayStatus) => void;
  onPostExpansion: () => void;
  onParentHighlight: (commentId: string) => void;
  onReplyClick: (commentId: string) => void;
  onReplySubmit: (parentCommentId: string, newComment: UltraFeedComment) => void;
  onReplyCancel: () => void;
  getNavigationProps: (commentId: string, displayComments: UltraFeedComment[]) => NavigationProps;
  onBranchToggle: (parentCommentId: string) => void;
  onNewReplyEdit: (editedComment: CommentsList) => void;
}

const UltraFeedThreadCommentsList = ({
  compressedItems,
  commentMetaInfos,
  commentDisplayStatuses,
  highlightStatuses,
  commentAuthorsMap,
  animatingCommentIds,
  visibleComments,
  newReplies,
  replyingToCommentId,
  postInitiallyExpanded,
  settings,
  threadIndex,
  onSetDisplayStatus,
  onPostExpansion,
  onParentHighlight,
  onReplyClick,
  onReplySubmit,
  onReplyCancel,
  getNavigationProps,
  onBranchToggle,
  onNewReplyEdit,
}: UltraFeedThreadCommentsListProps) => {
  const classes = useStyles(styles);

  const isCommentRead = (commentId: string) => {
    const metaInfo = commentMetaInfos?.[commentId];
    return !!metaInfo?.lastViewed || !!metaInfo?.lastInteracted;
  };

  const isNextItemRead = (commentIndex: number) => {
    if (commentIndex >= compressedItems.length - 1) return false;
    
    const nextItem = compressedItems[commentIndex + 1];
    if ("placeholder" in nextItem) {
      // For placeholder items, check if ALL hidden comments are read
      return nextItem.hiddenComments.every(h => isCommentRead(h._id));
    } else {
      // For regular comments
      return isCommentRead(nextItem._id);
    }
  };

  return (
    <>
      {compressedItems.map((item, commentIndex) => {
        if ("placeholder" in item) {
          const hiddenCount = item.hiddenComments.length;
          const anyHighlighted = item.hiddenComments.some(h => highlightStatuses[h._id]);
          const allRead = item.hiddenComments.every(h => isCommentRead(h._id));
          const nextItemIsRead = isNextItemRead(commentIndex);
          const isReadAndNextItemIsRead = allRead && nextItemIsRead;
          
          return (
            <div 
              className={classNames(classes.commentItem, {
                [classes.readItem]: allRead,
                [classes.readWithReadNext]: isReadAndNextItemIsRead,
                [classes.firstItemRead]: commentIndex === 0 && allRead
              })} 
              key={`placeholder-${commentIndex}`}
            >
              <UltraFeedCompressedCommentsItem
                numComments={hiddenCount}
                setExpanded={() => {
                  // Always expand max 5 comments at a time, from the bottom
                  item.hiddenComments.slice(-5).forEach(h => {
                    onSetDisplayStatus(h._id, "expandedToMaxInPlace");
                  });
                }}
                isFirstComment={commentIndex === 0}
                isLastComment={commentIndex === compressedItems.length - 1}
                isHighlighted={anyHighlighted}
                isRead={allRead}
              />
            </div>
          );
        } else {
          const cId = item._id;
          const isFirstItem = commentIndex === 0;
          const isLastItem = commentIndex === compressedItems.length - 1;
          const parentAuthorName = item.parentCommentId ? commentAuthorsMap[item.parentCommentId] : null;
          const isAnimating = animatingCommentIds.has(cId);
          const navigationProps = getNavigationProps(cId, visibleComments);
          const isNewReply = Object.values(newReplies).some(reply => reply._id === cId);
          const isRead = isCommentRead(cId);
          const nextItemIsRead = isNextItemRead(commentIndex);
          const isReadAndNextItemIsRead = isRead && nextItemIsRead;
          
          return (
            <div 
              key={cId} 
              className={classNames(classes.commentItem, { 
                [classes.readItem]: isRead,
                [classes.readWithReadNext]: isReadAndNextItemIsRead,
                [classes.firstItemRead]: commentIndex === 0 && isRead
              })}
            >
              <UltraFeedCommentItem
                comment={item}
                metaInfo={{
                  sources: [],
                  descendentCount: 0,
                  directDescendentCount: 0,
                  lastViewed: undefined,
                  lastInteracted: undefined,
                  servedEventId: '',
                  highlight: false,
                  ...commentMetaInfos?.[cId],
                  displayStatus: commentDisplayStatuses[cId] ?? commentMetaInfos?.[cId]?.displayStatus ?? "collapsed"
                }}
                onPostTitleClick={onPostExpansion}
                onChangeDisplayStatus={(newStatus) => onSetDisplayStatus(cId, newStatus)}
                showPostTitle={isFirstItem && !postInitiallyExpanded}
                postInitiallyExpanded={postInitiallyExpanded}
                highlight={highlightStatuses[cId] || false}
                isFirstComment={isFirstItem}
                isLastComment={isLastItem}
                settings={settings}
                parentAuthorName={parentAuthorName}
                onReplyIconClick={() => onParentHighlight(cId)}
                isHighlightAnimating={isAnimating}
                replyConfig={{
                  isReplying: replyingToCommentId === cId,
                  onReplyClick: () => onReplyClick(cId),
                  onReplySubmit: (newComment) => onReplySubmit(cId, newComment),
                  onReplyCancel: onReplyCancel,
                }}
                hasFork={navigationProps.showNav}
                currentBranch={navigationProps.currentBranch}
                threadIndex={threadIndex}
                commentIndex={commentIndex}
                onBranchToggle={() => navigationProps.forkParentId && onBranchToggle(navigationProps.forkParentId)}
                onEditSuccess={isNewReply ? onNewReplyEdit : () => {}}
              />
            </div>
          );
        }
      })}
    </>
  );
};

export default UltraFeedThreadCommentsList;
