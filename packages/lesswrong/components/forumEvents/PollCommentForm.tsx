import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { PartialDeep } from "type-fest";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import ForumEventCommentForm from "./ForumEventCommentForm";

/**
 * The post-vote comment form shared by both poll components (slider
 * `ForumEventPoll` and multiple-choice `ForumEventMcPoll`). Both prompt "What
 * made you vote this way?", tell the reader where their response will appear,
 * and count Skip as a vote; they differ only in the popover anchor and the
 * poll-specific `prefilledProps` metadata, which the caller supplies. Renders
 * nothing when the event has no associated post.
 */
const PollCommentForm = ({
  event,
  open,
  setOpen,
  currentUserComment,
  prefilledProps,
  refetchComments,
  anchorEl,
}: {
  event: ForumEventsDisplay;
  open: boolean;
  setOpen: (open: boolean) => void;
  currentUserComment: ShortformComments | null;
  prefilledProps: PartialDeep<DbComment>;
  refetchComments: () => Promise<void> | void;
  anchorEl: HTMLElement | null;
}) => {
  if (!event.post) return null;

  return (
    <ForumEventCommentForm
      open={open}
      comment={currentUserComment}
      prefilledProps={prefilledProps}
      successMessage="Success! Open the results to view everyone's votes and comments."
      forumEvent={event}
      cancelLabel="Skip"
      cancelCallback={() => setOpen(false)}
      successCallback={refetchComments}
      anchorEl={anchorEl}
      post={event.post}
      title="What made you vote this way?"
      subtitle={(post, comment) => (
        <div>
          Your response will appear as a comment on{" "}
          {event.isGlobal ? (
            <Link
              to={
                comment
                  ? commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id })
                  : postGetPageUrl(post)
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              this Debate Week post
            </Link>
          ) : (
            "this post"
          )}
          , and show next to your avatar in the results.
        </div>
      )}
    />
  );
};

export default registerComponent("PollCommentForm", PollCommentForm);
