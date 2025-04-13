import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import classNames from "classnames";
import { useSingle } from "@/lib/crud/withSingle";
import { postGetPollUrl } from "@/lib/collections/posts/helpers";

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

  const { document: forumEvent } = useSingle({
    documentId: comment.forumEventId,
    collectionName: "ForumEvents",
    fragmentName: 'ForumEventsMinimumInfo',
    skip: !comment.forumEventId
  });

  // TODO infer whether this is a global event from something on the forum event
  const isGlobal = forumEvent?.isGlobal;
  const pollLink = '#4EMWuknMt5H2gMhRc'

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

  const RootTag = isGlobal ? 'span' : 'a';

  return (
    <RootTag className={classes.root} href={pollLink}>
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
    </RootTag>
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
