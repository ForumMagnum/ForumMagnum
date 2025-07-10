import { useCallback, useState } from "react";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { ThreadableCommentType, unflattenComments } from "../../lib/utils/unflatten";
import type { CommentTreeOptions } from "../comments/commentTree";
import { captureEvent } from "../../lib/analyticsEvents";

export const useRecentDiscussionThread = <T extends ThreadableCommentType>({
  post,
  comments,
  refetch,
  commentTreeOptions = {},
  initialExpandAllThreads,
}: {
  post: PostsList,
  comments?: T[] | null,
  refetch: () => void,
  commentTreeOptions?: CommentTreeOptions,
  initialExpandAllThreads?: boolean,
}) => {
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null);
  const [expandAllThreads, setExpandAllThreads] = useState(initialExpandAllThreads ?? false);
  const {recordPostView, recordPostCommentsView} = useRecordPostView(post);

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
      const newHighlightVisible = !highlightVisible;
      setHighlightVisible(newHighlightVisible);
      
      captureEvent("recentDiscussionPostHighlightToggled", {
        postId: post._id,
        expanded: newHighlightVisible,
        wordCount: post.contents?.wordCount,
      });
      
      markAsRead();
    },
    [setHighlightVisible, highlightVisible, markAsRead, post._id, post.contents?.wordCount],
  );

  const markCommentsAsRead = useCallback(
    () => {
      // This is meant to be passed to e.g. an event listener (currently only use is with `onMouseUp`)
      // The setTimeout punts running this until the rest of event listeners triggered by same event are done
      // Necessary to avoid causing the child components those event listeners are on from rerendering before the event listeners run
      setTimeout(() => {
        setMarkedAsVisitedAt(new Date());
        void recordPostCommentsView({ post });  
      }, 0);
    },
    [recordPostCommentsView, post]
  );

  const lastCommentId = comments?.[0]?._id;
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
    scrollOnExpand: false,
    lastCommentId: lastCommentId,
    highlightDate: lastVisitedAt ? new Date(lastVisitedAt) : undefined,
    refetch: refetch,
    condensed: true,
    post,
    ...commentTreeOptions
  };

  return {
    isSkippable,
    showHighlight,
    markCommentsAsRead,
    expandAllThreads,
    lastVisitedAt,
    nestedComments,
    treeOptions,
  };
}
