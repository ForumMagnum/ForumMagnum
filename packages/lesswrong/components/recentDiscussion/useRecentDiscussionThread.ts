import { useCallback, useState } from "react";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { ThreadableCommentType, unflattenComments } from "../../lib/utils/unflatten";
import type { CommentTreeOptions } from "../comments/commentTree";

export const useRecentDiscussionThread = <T extends ThreadableCommentType>({
  post,
  comments,
  refetch,
  commentTreeOptions = {},
  initialExpandAllThreads,
} : {
  post: PostsRecentDiscussion,
  comments?: T[],
  refetch: () => void,
  commentTreeOptions?: CommentTreeOptions,
  initialExpandAllThreads?: boolean,
}) => {
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null);
  const [expandAllThreads, setExpandAllThreads] = useState(initialExpandAllThreads ?? false);
  const {recordPostView} = useRecordPostView(post);

  const markAsRead = useCallback(
    () => {
      setMarkedAsVisitedAt(new Date());
      setExpandAllThreads(true);
      recordPostView({post, extraEventProperties: {type: "recentDiscussionClick"}})
    },
    [setMarkedAsVisitedAt, setExpandAllThreads, recordPostView, post],
  );
  const showHighlight = useCallback(
    () => {
      setHighlightVisible(!highlightVisible);
      markAsRead();
    },
    [setHighlightVisible, highlightVisible, markAsRead],
  );

  const lastCommentId = comments && comments[0]?._id;
  const nestedComments = unflattenComments<T>(comments ?? []);

  const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

  // TODO verify whether/how this should be interacting with afCommentCount
  // New posts should render (to display their highlight).
  // Posts with at least one comment should only render if that those comments
  // meet the frontpage filter requirements
  const isSkippable = comments && !comments.length && post.commentCount !== null;

  const treeOptions: CommentTreeOptions = {
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    highlightDate: lastVisitedAt,
    refetch: refetch,
    condensed: true,
    post,
    ...commentTreeOptions
  };

  return {
    isSkippable,
    showHighlight,
    expandAllThreads,
    lastVisitedAt,
    nestedComments,
    treeOptions,
  };
}
