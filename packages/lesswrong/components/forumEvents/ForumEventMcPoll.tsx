import React, { useCallback, useMemo, useRef, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { gql, useMutation } from "@apollo/client";
import { PartialDeep } from "type-fest";
import { useCurrentUser } from "../common/withUser";
import { useMulti } from "@/lib/crud/withMulti";
import { useSingle } from "@/lib/crud/withSingle";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import { useMessages } from "../common/withMessages";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import {
  getMcPollPublicData,
  getMcPollVoteForUser,
  stripFootnotes,
} from "@/lib/collections/forumEvents/helpers";
import type { McPollAnswer } from "@/lib/collections/forumEvents/types";
import DeferRender from "../common/DeferRender";
import Loading from "../vulcan-core/Loading";
import ForumEventResultIcon, { ForumEventVoteDisplay } from "./ForumEventResultIcon";
import ForumEventCommentForm from "./ForumEventCommentForm";

const MAX_AVATARS_PER_ROW = 8;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: "var(--forum-event-banner-text)",
    padding: "0 8px 4px",
    maxWidth: 600,
    margin: "auto",
  },
  question: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: "normal",
    textAlign: "center",
    marginBottom: 16,
    color: "var(--forum-event-banner-text)",
  },
  questionLink: {
    color: "var(--forum-event-banner-text)",
    "&:hover": { color: "var(--forum-event-banner-text)", opacity: 0.8 },
  },
  subtitleWrapper: {
    minHeight: 17,
    marginBottom: 14,
    textAlign: "center",
  },
  viewResultsButton: {
    background: "none",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "normal",
    color: "var(--forum-event-banner-text)",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    padding: 0,
    cursor: "pointer",
    "&:hover": { opacity: 0.7 },
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  option: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 6,
    textAlign: "left",
    background: "none",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    border: "1px solid color-mix(in oklab, var(--forum-event-foreground) 22%, transparent)",
    cursor: "pointer",
    overflow: "hidden",
    "&:disabled": { cursor: "default" },
  },
  // The behind-content proportion bar.
  optionBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 0,
    background: "color-mix(in oklab, var(--forum-event-foreground) 14%, transparent)",
    transition: "width 0.55s ease",
    zIndex: 0,
  },
  optionContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  bullet: {
    flex: "none",
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid color-mix(in oklab, var(--forum-event-foreground) 60%, transparent)",
    boxSizing: "border-box",
  },
  bulletSquare: {
    borderRadius: 4,
  },
  bulletSelected: {
    background: "var(--forum-event-foreground)",
    borderColor: "var(--forum-event-foreground)",
  },
  label: {
    flex: 1,
    fontWeight: 500,
    color: "var(--forum-event-banner-text)",
  },
  percentage: {
    flex: "none",
    fontWeight: 600,
    color: "var(--forum-event-banner-text)",
  },
  voters: {
    display: "flex",
    alignItems: "center",
    marginLeft: 8,
  },
  extraVotersCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
    height: 24,
    padding: "0 4px",
    borderRadius: 12,
    background: "color-mix(in oklab, var(--forum-event-foreground) 20%, transparent)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--forum-event-banner-text)",
  },
  submitWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  submitButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
    color: "var(--forum-event-background)",
    background: "var(--forum-event-banner-text)",
    border: "none",
    "&:disabled": { opacity: 0.5, cursor: "default" },
  },
  loading: {
    marginTop: 12,
  },
});

type McPollAnswerResult = {
  answer: McPollAnswer;
  count: number;
  pct: number;
  voters: ForumEventVoteDisplay[];
};

/**
 * Tally a multiple-choice poll: per-answer counts, percentages (share of all
 * selections), and the list of voters (with their matched comment) for the
 * revealed-results avatars.
 */
export const aggregateMcPollVotes = ({
  event,
  voters,
  comments,
}: {
  event: ForumEventsDisplay | null | undefined;
  voters: UsersMinimumInfo[];
  comments: ShortformComments[] | undefined;
}): { results: McPollAnswerResult[]; voterCount: number } => {
  const { answers, votes } = getMcPollPublicData(event?.publicData);
  const votersById = new Map((voters ?? []).map((voter) => [voter._id, voter]));
  const commentsByUserId = new Map((comments ?? []).map((c) => [c.userId, c]));
  const tallies = new Map<string, { count: number; voters: ForumEventVoteDisplay[] }>(
    answers.map((answer) => [answer._id, { count: 0, voters: [] }])
  );

  for (const [userId, vote] of Object.entries(votes)) {
    const user = votersById.get(userId);
    const comment = commentsByUserId.get(userId) ?? null;
    for (const answerId of vote.answerIds) {
      const tally = tallies.get(answerId);
      if (!tally) continue;
      tally.count += 1;
      if (user) {
        tally.voters.push({ x: 0, user, comment });
      }
    }
  }

  const totalSelections = answers.reduce(
    (sum, answer) => sum + (tallies.get(answer._id)?.count ?? 0),
    0
  );
  const results = answers.map((answer) => {
    const tally = tallies.get(answer._id)!;
    return {
      answer,
      count: tally.count,
      pct: totalSelections > 0 ? Math.round((tally.count / totalSelections) * 100) : 0,
      voters: tally.voters,
    };
  });

  return { results, voterCount: Object.keys(votes).length };
};

/**
 * Multiple-choice poll: same card/colours/affordances as the slider
 * (ForumEventPoll), but voters pick from a list of answers (single- or
 * multi-select). Results show as horizontal proportion bars with voter avatars,
 * hidden behind "view results". After voting the same comment prompt appears.
 */
export const ForumEventMcPoll = ({
  hideViewResults,
  classes,
  forumEventId,
  className,
}: {
  hideViewResults?: boolean;
  classes: ClassesType<typeof styles>;
  forumEventId?: string;
  className?: string;
}) => {
  const { currentForumEvent, refetch: refetchCurrentEvent } = useCurrentAndRecentForumEvents();
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  const { flash } = useMessages();

  const { document: eventFromId, refetch: refetchOverrideEvent } = useSingle({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    documentId: forumEventId,
    skip: !forumEventId,
  });

  const event = forumEventId ? eventFromId : currentForumEvent;
  const refetch = forumEventId ? refetchOverrideEvent : refetchCurrentEvent;
  const votingOpen = event ? (!event.endDate || new Date(event.endDate) > new Date()) : false;

  const { multiSelect } = getMcPollPublicData(event?.publicData);

  const submittedAnswerIds = useMemo(
    () => getMcPollVoteForUser(event?.publicData, currentUser?._id) ?? [],
    [event?.publicData, currentUser?._id]
  );
  // Local selection (for multi-select, before the reader clicks "Submit vote").
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>(submittedAnswerIds);
  // Re-sync local selection when the persisted vote changes (e.g. after refetch).
  const submittedKey = submittedAnswerIds.join(",");
  const lastSubmittedKey = useRef(submittedKey);
  if (lastSubmittedKey.current !== submittedKey) {
    lastSubmittedKey.current = submittedKey;
    setSelectedAnswerIds(submittedAnswerIds);
  }

  const plaintextQuestion = useMemo(
    () => (event?.pollQuestion?.html ? stripFootnotes(event.pollQuestion.html) : null),
    [event?.pollQuestion?.html]
  );
  const questionNode = useMemo(() => {
    if (!plaintextQuestion) return null;
    return event?.post ? (
      <Link to={postGetPageUrl(event.post)} className={classes.questionLink}>
        {plaintextQuestion}
      </Link>
    ) : (
      plaintextQuestion
    );
  }, [plaintextQuestion, event?.post, classes.questionLink]);

  const [resultsVisible, setResultsVisible] = useState(false);
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  // The voters are the userIds that have a vote recorded in publicData.
  const voterIds = useMemo(
    () => Object.keys(getMcPollPublicData(event?.publicData).votes),
    [event?.publicData]
  );
  const votersRef = useRef<UsersMinimumInfo[]>([]);
  const { results: voters } = useMulti({
    terms: { view: "usersByUserIds", userIds: voterIds, limit: 1000 },
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    enableTotal: false,
    skip: voterIds.length === 0,
  });
  if (voters !== undefined) {
    votersRef.current = voters;
  }
  const { results: comments, refetch: refetchComments } = useMulti({
    terms: { view: "forumEventComments", forumEventId: event?._id, limit: 1000 },
    collectionName: "Comments",
    fragmentName: "ShortformComments",
    enableTotal: false,
    skip: !event?._id,
  });

  const { results, voterCount } = useMemo(
    () => aggregateMcPollVotes({ event, voters: votersRef.current, comments }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event, votersRef.current, comments]
  );
  const votesLoading = voters === undefined && votersRef.current.length === 0;

  const currentUserComment = useMemo(
    () => comments?.find((comment) => comment.userId === currentUser?._id) || null,
    [comments, currentUser]
  );

  const [addMcVote] = useMutation(gql`
    mutation AddForumEventMcVote($forumEventId: String!, $answerIds: [String!]!) {
      AddForumEventMcVote(forumEventId: $forumEventId, answerIds: $answerIds)
    }
  `);

  const submitVote = useCallback(
    async (answerIds: string[], openCommentForm: boolean) => {
      if (!currentUser) {
        onSignup();
        return;
      }
      if (!event) return;
      try {
        await addMcVote({ variables: { forumEventId: event._id, answerIds } });
        if (openCommentForm && answerIds.length > 0 && event.post) {
          setCommentFormOpen(true);
        }
        refetch?.();
        captureEvent("addForumEventMcVote", { forumEventId: event._id, answerIds });
      } catch (e) {
        flash((e as Error).message);
      }
    },
    [currentUser, event, addMcVote, onSignup, refetch, captureEvent, flash]
  );

  const handleSelect = useCallback(
    (answerId: string) => {
      if (!votingOpen) return;
      if (!currentUser) {
        onSignup();
        return;
      }
      if (multiSelect) {
        setSelectedAnswerIds((prev) =>
          prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]
        );
      } else {
        void submitVote([answerId], true);
      }
    },
    [votingOpen, currentUser, multiSelect, onSignup, submitVote]
  );

  const selectionChanged =
    selectedAnswerIds.length !== submittedAnswerIds.length ||
    selectedAnswerIds.some((id) => !submittedAnswerIds.includes(id));
  const submitDisabled = selectedAnswerIds.length === 0 || !selectionChanged;

  if (!event) return null;

  const commentPrompt = `<blockquote>${plaintextQuestion}</blockquote><p></p>`;
  const commentPrefilledProps: PartialDeep<DbComment> =
    !currentUserComment && submittedAnswerIds.length > 0
      ? {
          forumEventMetadata: {
            eventFormat: "POLL",
            sticker: null,
            mcPoll: {
              answerIdsWhenPublished: submittedAnswerIds,
              latestAnswerIds: null,
              pollQuestionWhenPublished: event.pollQuestion?._id ?? null,
              commentPrompt,
            },
          },
          parentCommentId: event.commentId,
          ...(!event.isGlobal && {
            contents: {
              originalContents: { type: "ckEditorMarkup", data: commentPrompt },
            },
          }),
        }
      : {};

  return (
    <AnalyticsContext pageElementContext="forumEventMcPoll">
      <div className={classNames(classes.root, className)} ref={anchorRef}>
        {questionNode && <div className={classes.question}>{questionNode}</div>}
        <div className={classes.subtitleWrapper}>
          <DeferRender ssr={false}>
            {!hideViewResults && (
              !resultsVisible ? (
                <button className={classes.viewResultsButton} onClick={() => setResultsVisible(true)}>
                  {voterCount > 0 ? `View results (${voterCount})` : "View results"}
                </button>
              ) : (
                <button className={classes.viewResultsButton} onClick={() => setResultsVisible(false)}>
                  Hide results
                </button>
              )
            )}
          </DeferRender>
        </div>

        <div className={classes.options}>
          {results.map(({ answer, pct, voters: answerVoters }) => {
            const selected = selectedAnswerIds.includes(answer._id);
            const extraVoters = answerVoters.length - MAX_AVATARS_PER_ROW;
            return (
              <button
                key={answer._id}
                type="button"
                className={classes.option}
                disabled={!votingOpen}
                onClick={() => handleSelect(answer._id)}
              >
                <div
                  className={classes.optionBar}
                  style={{ width: resultsVisible ? `${pct}%` : 0 }}
                />
                <div className={classes.optionContent}>
                  <div
                    className={classNames(
                      classes.bullet,
                      multiSelect && classes.bulletSquare,
                      selected && classes.bulletSelected
                    )}
                  />
                  <div className={classes.label}>{answer.text}</div>
                  {resultsVisible && (
                    <>
                      <div className={classes.voters}>
                        {answerVoters.slice(0, MAX_AVATARS_PER_ROW).map((vote) => (
                          <ForumEventResultIcon
                            key={vote.user._id}
                            vote={vote}
                            tooltipDisabled={!resultsVisible}
                          />
                        ))}
                        {extraVoters > 0 && (
                          <div className={classes.extraVotersCircle}>+{extraVoters}</div>
                        )}
                      </div>
                      <div className={classes.percentage}>{pct}%</div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {multiSelect && votingOpen && (
          <div className={classes.submitWrapper}>
            <button
              className={classes.submitButton}
              disabled={submitDisabled}
              onClick={() => void submitVote(selectedAnswerIds, true)}
            >
              Submit vote
            </button>
          </div>
        )}

        {resultsVisible && votesLoading && <Loading className={classes.loading} white />}

        {event.post && (
          <ForumEventCommentForm
            open={commentFormOpen}
            comment={currentUserComment}
            prefilledProps={commentPrefilledProps}
            successMessage="Success! Open the results to view everyone's votes and comments."
            forumEvent={event}
            cancelLabel="Skip"
            cancelCallback={() => setCommentFormOpen(false)}
            successCallback={refetchComments}
            anchorEl={anchorRef.current}
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
        )}
      </div>
    </AnalyticsContext>
  );
};

export default registerComponent("ForumEventMcPoll", ForumEventMcPoll, { styles });
