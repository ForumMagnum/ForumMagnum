import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import classNames from "classnames";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { stripFootnotes } from "@/lib/collections/forumEvents/helpers";
import LWTooltip from "../../common/LWTooltip";

const ForumEventsMinimumInfoQuery = gql(`
  query CommentPollVote($documentId: String) {
    forumEvent(input: { selector: { documentId: $documentId } }) {
      result {
        ...ForumEventsDisplay
      }
    }
  }
`);

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
    transform: "translateY(-10px)",
  },
});

const CommentPollVote = ({ comment, classes }: { comment: CommentsList; classes: ClassesType<typeof styles> }) => {
  const voteWhenPublished = comment.forumEventMetadata?.poll?.voteWhenPublished;
  const latestVote = comment.forumEventMetadata?.poll?.latestVote;

  const { loading, data } = useQuery(ForumEventsMinimumInfoQuery, {
    variables: { documentId: comment.forumEventId },
    skip: !comment.forumEventId,
    ssr: false,
  });
  
  const forumEvent = data?.forumEvent?.result;

  const isGlobal = forumEvent?.isGlobal !== false;
  const pollLink = (!isGlobal && forumEvent) ? `#${forumEvent._id}` : undefined;

  const agreeWording = forumEvent?.pollAgreeWording || "agree";
  const disagreeWording = forumEvent?.pollDisagreeWording || "disagree";

  if (voteWhenPublished === null || voteWhenPublished === undefined) return null;

  const isAgreement = (pollVote: number) => pollVote >= 0.5;
  const voteToPercentage = (pollVote: number) => `${Math.round(Math.abs(pollVote - 0.5) * 200)}%`;

  const endAgreement = isAgreement(latestVote ?? voteWhenPublished);
  const startAgreement = isAgreement(voteWhenPublished);

  const endPercentage = voteToPercentage(latestVote ?? voteWhenPublished);
  const startPercentage = voteToPercentage(voteWhenPublished);

  const showStartAgreement = startAgreement !== endAgreement;
  const showStartPercentage = showStartAgreement || endPercentage !== startPercentage;

  const CurrentVoteTag = isGlobal ? 'span' : 'a';

  const questionWording = forumEvent?.pollQuestion?.html && stripFootnotes(forumEvent.pollQuestion.html);

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
      <LWTooltip
        title={questionWording && <span>With the question "{questionWording}"</span>}
        placement="top"
        popperClassName={classes.tooltip}
      >
        <CurrentVoteTag className={endAgreement ? classes.agreePollVote : classes.disagreePollVote} href={pollLink}>
          {endPercentage}
          {endAgreement ? ` ${agreeWording}` : ` ${disagreeWording}`}
        </CurrentVoteTag>
      </LWTooltip>
    </span>
  );
};

export default registerComponent("CommentPollVote", CommentPollVote, {
  styles,
});


