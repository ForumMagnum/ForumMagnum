import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { useVoteButtonsDisabled } from "../votes/useVoteButtonsDisabled";
import { useDialog } from "../common/withDialog";
import { useCurrentUser } from "../common/withUser";
import { useVote } from "../votes/withVote";
import { useMessages } from "../common/withMessages";
import classNames from "classnames";
import LoginPopup from "../users/LoginPopup";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";

export const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    color: theme.palette.grey[600],
  },
  button: {
    padding: 2,
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

/**
 * This component contains a new redesign of the posts item tag relevance vote.
 * It is not currently used as we haven't decided how to visually handle strong
 * votes yet, but most of the logic is in place. Once the design is finished, this
 * is a drop-in replacement for `PostsItemTagRelevance` in `EAPostsItem`.
 */
const EAPostsItemTagRelevance = ({tagRel, classes}: {
  tagRel: WithVoteTagRel,
  classes: ClassesType<typeof styles>,
}) => {
  const {openDialog} = useDialog();
  const {flash} = useMessages();
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();
  const {fail, reason: whyYouCantVote} = useVoteButtonsDisabled();
  const canVote = !fail;
  const {
    document,
    collectionName,
    baseScore,
    vote,
    voteCount,
  } = useVote(tagRel, "TagRels");

  const onVote = (voteType: string, isVoted: boolean) => async () => {
    if (currentUser && canVote) {
      await vote({
        document,
        voteType: isVoted ? "neutral" : voteType,
      });
      captureEvent("vote", {collectionName});
    } else if (currentUser) {
      flash(whyYouCantVote ?? "You can't vote on this");
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
    }
  }

  const isUpvoted = document.currentUserVote ? document.currentUserVote.indexOf("Up") > 0 : false;
  const isDownvoted = document.currentUserVote ? document.currentUserVote.indexOf("Down") > 0 : false;
  return (
    <div className={classes.root}>
      <ForumIcon
        icon="MinusSmall"
        onClick={onVote("smallDownvote", isDownvoted)}
        className={classNames(
          classes.button,
          classes.downvote,
          {[classes.downvoted]: isDownvoted},
        )}
      />
      <LWTooltip title={
        <div>
          <div>{baseScore} Relevance</div>
          <div>({voteCount} {voteCount === 1 ? "vote" : "votes"})</div>
          {!canVote && whyYouCantVote}
        </div>
      }>
        <span>{baseScore}</span>
      </LWTooltip>
      <ForumIcon
        icon="PlusSmall"
        onClick={onVote("smallUpvote", isUpvoted)}
        className={classNames(
          classes.button,
          classes.upvote,
          {[classes.upvoted]: isUpvoted},
        )}
      />
    </div>
  );
}

export default registerComponent(
  "EAPostsItemTagRelevance",
  EAPostsItemTagRelevance,
  {styles},
);


