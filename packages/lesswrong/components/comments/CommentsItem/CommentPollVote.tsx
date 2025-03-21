import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import classNames from "classnames";
import { useSingle } from "@/lib/crud/withSingle";

const styles = (theme: ThemeType) => ({
  root: {
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  agreePollVote: {
    color: theme.palette.primary.main,
  },
  disagreePollVote: {
    color: theme.palette.warning.main,
  },
  tooltip: {
    marginBottom: 6,
  },
});

const CommentPollVote = ({ comment, classes }: { comment: CommentsList; classes: ClassesType<typeof styles> }) => {
  const { LWTooltip } = Components;

  const voteWhenPublished = comment.forumEventMetadata?.poll?.voteWhenPublished;
  const latestVote = comment.forumEventMetadata?.poll?.latestVote;

  const { document: forumEvent, loading } = useSingle({
    documentId: comment.forumEventId,
    collectionName: "ForumEvents",
    fragmentName: 'ForumEventsMinimumInfo',
    skip: !comment.forumEventId
  });

  const agreeWording = forumEvent?.pollAgreeWording || "agree";
  const disagreeWording = forumEvent?.pollDisagreeWording || "disagree";

  if (!voteWhenPublished) return null;

  const isAgreement = (pollVote: number) => pollVote >= 0.5;
  const voteToPercentage = (pollVote: number) => `${Math.round(Math.abs(pollVote - 0.5) * 200)}%`;

  const endAgreement = isAgreement(latestVote ?? voteWhenPublished);
  const startAgreement = isAgreement(voteWhenPublished);

  const endPercentage = voteToPercentage(latestVote ?? voteWhenPublished);
  const startPercentage = voteToPercentage(voteWhenPublished);

  const showStartAgreement = startAgreement !== endAgreement;
  const showStartPercentage = showStartAgreement || endPercentage !== startPercentage;

  return (
    <span className={classes.root}>
      {showStartPercentage && (
        <span className={classNames(startAgreement ? classes.agreePollVote : classes.disagreePollVote)}>
          <LWTooltip title="Vote when comment was posted" placement="top" popperClassName={classes.tooltip}>
            <s>
              {startPercentage}
              {showStartAgreement && (startAgreement ? ` ${agreeWording}` : ` ${disagreeWording}`)}
            </s>
          </LWTooltip>
          {/* Right arrow */}
          &nbsp;&#10132;&nbsp;
        </span>
      )}
      <span className={endAgreement ? classes.agreePollVote : classes.disagreePollVote}>
        {endPercentage}
        {endAgreement ? ` ${agreeWording}` : ` ${disagreeWording}`}
      </span>
    </span>
  );
};

const CommentPollVoteComponent = registerComponent("CommentPollVote", CommentPollVote, {
  styles,
});

declare global {
  interface ComponentTypes {
    CommentPollVote: typeof CommentPollVoteComponent;
  }
}
