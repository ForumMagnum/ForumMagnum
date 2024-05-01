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
}: {
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
      void recordPostView({post, extraEventProperties: {type: "recentDiscussionClick"}, recommendationOptions: {skip: true}})
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

  // For posts that have never been commented on, we do want to show them in the
  // recent discussion feed. For posts which have been commented on, but the comments
  // have been deleted, we don't want to show them (these are usually spam).
  //
  // There is no completely reliable way to tell the difference, but this is a fairly conservative
  // (in favour of showing a post) heuristic.
  const probablyNeverCommentedOn =
    new Date(post.lastCommentedAt).getTime() - new Date(post.postedAt).getTime() < 30_000;

  // TODO verify whether/how this should be interacting with afCommentCount
  // New posts should render (to display their highlight).
  // Posts with at least one comment should only render if those comments
  // meet the frontpage filter requirements
  const isSkippable = comments && !comments.length && !probablyNeverCommentedOn;

  const treeOptions: CommentTreeOptions = {
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    highlightDate: lastVisitedAt ?? undefined,
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
