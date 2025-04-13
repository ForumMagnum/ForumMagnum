import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import classNames from "classnames";
import { useSingle } from "@/lib/crud/withSingle";
import { postGetPollUrl } from "@/lib/collections/posts/helpers";
import { parseDocumentFromString } from "@/lib/domParser";

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

/**
 * Removes any footnotes and converts what remains to plain text
 */
function stripFootnotes(html: string): string {
  const { document } = parseDocumentFromString(html);

  // Remove every footnote reference
  document.querySelectorAll(".footnote-reference").forEach(ref => ref.remove());

  // Remove the entire .footnotes block (where the list of footnotes usually lives)
  const footnotesBlock = document.querySelector(".footnotes");
  footnotesBlock?.remove();

  return (document.body.textContent || "").trim();
}

const CommentPollVote = ({ comment, classes }: { comment: CommentsList; classes: ClassesType<typeof styles> }) => {
  const { LWTooltip } = Components;

  const voteWhenPublished = comment.forumEventMetadata?.poll?.voteWhenPublished;
  const latestVote = comment.forumEventMetadata?.poll?.latestVote;

  const { document: forumEvent } = useSingle({
    documentId: comment.forumEventId,
    collectionName: "ForumEvents",
    fragmentName: 'ForumEventsDisplay',
    skip: !comment.forumEventId,
    ssr: false
  });

  const isGlobal = forumEvent?.isGlobal !== false;
  // TODO make this act like the "see in context" button on comments
  const pollLink = (!isGlobal && forumEvent) ? `#${forumEvent._id}` : undefined;

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

  const CurrentVoteTag = isGlobal ? 'span' : 'a';

  const questionWording = forumEvent?.pollQuestion?.html && stripFootnotes(forumEvent.pollQuestion.html);

  return (
    <span className={classes.root}>
      {showStartPercentage && (
        <span className={classNames(startAgreement ? classes.agreePollVote : classes.disagreePollVote)}>
          {/* TODO note that I would prefer to remove this */}
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

const CommentPollVoteComponent = registerComponent("CommentPollVote", CommentPollVote, {
  styles,
});

declare global {
  interface ComponentTypes {
    CommentPollVote: typeof CommentPollVoteComponent;
  }
}
