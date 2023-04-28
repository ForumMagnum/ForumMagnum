import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useTracking } from "../../lib/analyticsEvents";
import { userCanVote } from "../../lib/collections/users/helpers";
import { useDialog } from "../common/withDialog";
import { useCurrentUser } from "../common/withUser";
import { useVote } from "../votes/withVote";
import { useMessages } from "../common/withMessages";
import classNames from "classnames";

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    gap: "8px",
    padding: "12px 4px",
    color: theme.palette.grey[600],
  },
  button: {
    useSelect: "none",
    "&:hover": {
      opacity: 1,
    },
  },
  upvote: {
    "&:hover": {
      color: theme.palette.primary.light,
    },
  },
  upvoted: {
    color: theme.palette.primary.main,
  },
  downvote: {
    "&:hover": {
      color: theme.palette.error.main,
    },
  },
  downvoted: {
    color: theme.palette.error.main,
  },
});

const EAPostsItemTagRelevance = ({tagRel, classes}: {
  tagRel: WithVoteTagRel,
  classes: ClassesType,
}) => {
  const {openDialog} = useDialog();
  const {flash} = useMessages();
  const {captureEvent} = useTracking();
  const {document, baseScore, vote, voteCount} = useVote(tagRel, "TagRels");
  const currentUser = useCurrentUser();
  const {fail, reason: whyYouCantVote} = userCanVote(currentUser);
  const canVote = !fail;

  const onVote = (voteType: string, isVoted: boolean) => async () => {
    if (currentUser && canVote) {
      vote({
        document,
        voteType: isVoted ? "neutral" : voteType,
        currentUser,
      });
      captureEvent("vote", {collectionName: "TagRels"});
    } else if (currentUser) {
      flash(whyYouCantVote ?? "You can't vote on this");
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
    }
  }

  const isUpvoted = document.currentUserVote?.indexOf("Up") > 0;
  const isDownvoted = document.currentUserVote?.indexOf("Down") > 0;

  const {LWTooltip} = Components;

  return (
    <div className={classes.root}>
      <a
        onClick={onVote("smallDownvote", isDownvoted)}
        className={classNames(
          classes.button,
          classes.downvote,
          {[classes.downvoted]: isDownvoted},
        )}
      >
        -
      </a>
      <LWTooltip title={
        <div>
          <div>{baseScore} Relevance</div>
          <div>({voteCount} {voteCount === 1 ? "vote" : "votes"})</div>
          {!canVote && whyYouCantVote}
        </div>
      }>
        <span>{baseScore}</span>
      </LWTooltip>
      <a
        onClick={onVote("smallUpvote", isUpvoted)}
        className={classNames(
          classes.button,
          classes.upvote,
          {[classes.upvoted]: isUpvoted},
        )}
      >
        +
      </a>
    </div>
  );
}

const EAPostsItemTagRelevanceComponent = registerComponent(
  "EAPostsItemTagRelevance",
  EAPostsItemTagRelevance,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAPostsItemTagRelevance: typeof EAPostsItemTagRelevanceComponent
  }
}
