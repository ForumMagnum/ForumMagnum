import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { useCurrentUser } from "../common/withUser";
import { useEventListener } from "../hooks/useEventListener";
import { gql, useMutation } from "@apollo/client";
import { useMulti } from "@/lib/crud/withMulti";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import range from "lodash/range";
import sortBy from "lodash/sortBy";
import DeferRender from "../common/DeferRender";
import type { ForumEventVoteDisplay } from "./ForumEventResultIcon";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { parseDocumentFromString, ServerSafeNode } from "@/lib/domParser";
import { PartialDeep } from "type-fest";
import { stripFootnotes } from "@/lib/collections/forumEvents/helpers";
import { useMessages } from "../common/withMessages";
import { useSingle } from "@/lib/crud/withSingle";

const SLIDER_MAX_WIDTH = 1120;
const RESULT_ICON_MAX_HEIGHT = 27;
const USER_IMAGE_SIZE = 30;
const DEFAULT_STACK_IMAGES = 20;
const NUM_TICKS = 19;
const GAP = "calc(0.6% + 4px)" // Accounts for 2px outline

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: 'center',
    color: "var(--forum-event-banner-text)",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "0px 24px 15px 24px",
    margin: "0 auto",
    maxWidth: "100%",
  },
  question: {
    fontSize: 32,
    lineHeight: '100%',
    fontWeight: 700,
    maxWidth: 730,
    marginBottom: 13,
    marginLeft: "auto",
    marginRight: "auto"
  },
  questionFootnote: {
    fontSize: 20,
    verticalAlign: 'super',
  },
  sliderRow: {
    display: "flex",
    justifyContent: "center",
  },
  sliderLineCol: {
    flexGrow: 1,
    maxWidth: `min(${SLIDER_MAX_WIDTH}px, 100%)`,
    position: "relative",
    padding: "8px 16px 0px 16px",
    overflow: "hidden"
  },
  sliderLineResults: {
    display: "flex",
    justifyContent: "space-between",
    gap: GAP,
    marginBottom: (USER_IMAGE_SIZE / 2) + 12,
    maxWidth: "100%",
    position: "relative",
    transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
    maxHeight: 0,
  },
  voteCluster: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end", // Stack votes from bottom to top
    position: "relative",
  },
  extraVotesCircle: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--forum-event-foreground)",
    color: "var(--forum-event-background)",
    borderRadius: "50%",
    fontWeight: "bold",
    width: "calc(100% + 4px)",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    position: "relative",
  },
  // Inner element needed so that extraVotesCircle can't expand horizontally
  extraVotesText: {
    position: "absolute",
    whiteSpace: "nowrap",
    top: "50%",
    left: "50%",
    transform: "translate(-54%, -54%)",
    fontSize: 14,
    overflow: "hidden",
    textOverflow: "ellipsis",
    [theme.breakpoints.down('sm')]: {
      fontSize: 10,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 7,
      transform: "translate(-50%, -50%)",
    },
  },
  sliderLine: {
    position: "relative",
    width: "100%",
    height: 2,
    backgroundColor: "var(--forum-event-foreground)",
    marginBottom: "16px",
    transition: "transform 0.5s ease-in-out",
  },
  ticksContainer: {
    position: "absolute",
    top: -(USER_IMAGE_SIZE / 2),
    left: 0,
    right: 0,
    height: USER_IMAGE_SIZE,
    paddingTop: (USER_IMAGE_SIZE - 12) / 2,
    paddingBottom: (USER_IMAGE_SIZE - 12) / 2,
    display: "flex",
    gap: GAP,
    '&:hover $tick': {
      opacity: 1,
    },
  },
  tick: {
    flex: 1,
    position: "relative",
    '&::before': {
      content: '""',
      position: "absolute",
      top: 0,
      bottom: 0,
      left: "50%",
      width: 2,
      backgroundColor: "var(--forum-event-foreground)",
      opacity: 0.3,
      transform: "translateX(-50%)",
    },
    opacity: 0,
    transition: "opacity 0.2s",
  },
  tickDragging: {
    opacity: 1,
  },
  centralTick: {
    opacity: 0.3,
    '&::before': {
      height: "125%",
      top: "-5%",
      backgroundColor: "var(--forum-event-foreground)",
      opacity: 1,
    },
    '&$tickDragging': {
      opacity: 1,
    },
  },
  sliderArrow: {
    stroke: "var(--forum-event-foreground)",
    position: "absolute",
    top: -11,
  },
  sliderArrowLeft: {
    transform: "translateX(-8px)",
    left: 0,
  },
  sliderArrowRight: {
    transform: "translateX(8px)",
    right: 0,
  },
  voteTooltipHeading: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: '140%',
    marginBottom: 4,
  },
  voteTooltipBody: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '140%',
  },
  userImage: {
    outline: `2px solid var(--forum-event-foreground)`,
  },
  placeholderUserIcon: {
    // add a black background to the placeholder user circle icon
    background: `radial-gradient(${theme.palette.text.alwaysBlack} 50%, transparent 50%)`,
    color: "var(--forum-event-foreground)",
    fontSize: 44,
    borderRadius: '50%',
    marginLeft: -5,
    marginTop: -4
  },
  iconButton: {
    display: 'none',
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: `color-mix(in oklab, ${theme.palette.text.alwaysBlack} 10%, color-mix(in oklab, var(--forum-event-background) 65%, var(--forum-event-foreground) 35%))`,
    padding: 2,
    borderRadius: '50%',
    cursor: 'pointer',
    width: 15,
    height: 15,
    "&:hover": {
      backgroundColor: `color-mix(in oklab, ${theme.palette.text.alwaysBlack} 10%, var(--forum-event-background) 90%)`,
    },
  },
  clearVote: {
    top: -5,
    right: -5,
    '& svg': {
      fontSize: 11

    }
  },
  toggleCommentForm: {
    top: 22,
    right: -5,
    '& svg': {
      fontSize: 9,
      marginTop: 1,
      marginLeft: 1
    }
  },
  votePromptWrapper: {
    minHeight: 17,
    marginBottom: 14
  },
  votePrompt: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "normal",
    maxWidth: SLIDER_MAX_WIDTH,
    margin: "auto"
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    marginTop: 22,
    marginBottom: 6
  },
  viewResultsButton: {
    background: 'none',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    color: "var(--forum-event-banner-text)",
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    padding: 0,
    '&:hover': {
      opacity: 0.7
    },
  },
  hideResultsButton: {
    display: "block",
    marginLeft: "auto",
    marginRight: 12
  },
  userVote: {
    position: "absolute",
    top: 0,
    zIndex: 10,
  },
  currentUserVote: {
    opacity: 0.6,
    cursor: "grab",
    zIndex: 15,
    touchAction: "none",
    transform: "translateX(-50%)",
    "&:hover": {
      opacity: 1,
    },
    "& img": {
      maxWidth: USER_IMAGE_SIZE
    }
  },
  currentUserVoteClosed: {
    cursor: "default",
  },
  currentUserVoteDragging: {
    cursor: "grabbing",
  },
  currentUserVoteActive: {
    opacity: 1,
    "&:hover .ForumEventPoll-iconButton": {
      display: "flex",
    },
  },
});

export type ForumEventVoteData = {
  forumEventId: string,
  x: number,
  delta?: number,
  postIds?: string[]
}

const DEFAULT_VOTE_INDEX = Math.floor(NUM_TICKS / 2);

/**
 * Pull out the given user's vote in the forum event. Note that 0 is a valid vote.
 */
export const getForumEventVoteForUser = (
  event?: ForumEventsDisplay|null,
  user?: UsersMinimumInfo|null
): number|null => {
  return user ? (event?.publicData?.[user._id]?.x ?? null) : null
}

type ForumEventVoteDisplayCluster = {
  center: number,
  votes: ForumEventVoteDisplay[]
}

/**
 * Groups the given forum event votes into NUM_TICKS equal-width clusters
 */
const clusterForumEventVotes = ({
  voters,
  comments,
  event,
  currentUser,
}: {
  voters: UsersMinimumInfo[];
  comments: ShortformComments[] | undefined;
  event: ForumEventsDisplay | null | undefined;
  currentUser: UsersCurrent | null;
}): ForumEventVoteDisplayCluster[] => {
  if (!voters || !event || !event.publicData) return [];

  const votes = sortBy(voters
    .filter((voter) => event.publicData[voter._id]?.x !== null && event.publicData[voter._id]?.x !== undefined)
    .map((voter) => {
      const vote = event.publicData[voter._id].x as number;
      return {
        x: vote,
        user: voter,
        // O(n^2), but unlikely to be a problem given the numbers involved
        comment: comments?.find(comment => comment.userId === voter._id) || null
      };
    }), "x");

  const clusters: ForumEventVoteDisplayCluster[] = range(0, NUM_TICKS).map((i) => ({
    center: i / (NUM_TICKS - 1),
    votes: [],
  }));

  for (const vote of votes) {
    const adjustedX = Math.min(vote.x, 0.999999);
    const clusterIndex = Math.floor(adjustedX * NUM_TICKS);
    clusters[clusterIndex].votes.push(vote);
  }

    for (const cluster of clusters) {
    cluster.votes.sort((a, b) => {
      // Current user should always appear at the bottom
      if (a.user._id === currentUser?._id) return 1;
      if (b.user._id === currentUser?._id) return -1;

      // Votes with comments should appear closer to the bottom
      if (a.comment && !b.comment) return 1;
      if (!a.comment && b.comment) return -1;

      // Alphabetically by name
      return a.user.displayName.toLowerCase().localeCompare(b.user.displayName.toLowerCase());
    });
  }

  return clusters;
};

function footnotesToTooltips({
  html,
  event,
  classes,
}: {
  html: string;
  event: ForumEventsDisplay;
  classes: ClassesType<typeof styles>;
}): React.ReactNode[] {
  const { LWTooltip } = Components;

  const { document } = parseDocumentFromString(html);

  const footnotes = Array.from(document.querySelectorAll(".footnote-item"));
  const footnotesMap: Record<string, string> = {};
  for (const li of footnotes) {
    const footnoteId = li.getAttribute("data-footnote-id");
    if (!footnoteId) continue;
    const footnoteHtml = li.querySelector(".footnote-content")?.innerHTML ?? "";
    footnotesMap[footnoteId] = footnoteHtml;
  }

  // Remove the footnotes block from the DOM so we don't flatten it
  const footnotesList = document.querySelector(".footnotes");
  footnotesList?.remove();

  const resultArray: React.ReactNode[] = [];

  function walkNode(node: ChildNode) {
    // If TEXT_NODE, just push its text, dropping the specific html tag etc
    if (node.nodeType === ServerSafeNode.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim() !== "") {
        resultArray.push(text);
      }
      return;
    }

    if (node.nodeType === ServerSafeNode.ELEMENT_NODE) {
      const el = node as Element;

      // If it's a .footnote-reference, produce a <LWTooltip>
      if (el.classList.contains("footnote-reference")) {
        const footnoteId = el.getAttribute("data-footnote-id") || "";
        const content = footnotesMap[footnoteId] || "";

        // Extract just digits from e.g. "[1]" → "1"
        const footnoteNumberRaw = el.textContent?.trim() || "";
        const footnoteNumber = footnoteNumberRaw.replace(/[^\d]+/g, "") || "?";

        const tooltipNode = (
          <LWTooltip
            key={footnoteNumber}
            title={<div dangerouslySetInnerHTML={{ __html: content }} />}
          >
            <span
              className={classes.questionFootnote}
              style={{ color: event.contrastColor ?? event.darkColor }}
            >
              {footnoteNumber}
            </span>
          </LWTooltip>
        );
        resultArray.push(tooltipNode);
      } else {
        Array.from(el.childNodes).forEach(walkNode);
      }
    }
  }

  // Walk all top level nodes, recursing into child nodes
  Array.from(document.body.childNodes).forEach(walkNode);

  return resultArray;
}

/**
 * This component is for forum events that have a poll.
 * Displays the question, a slider where the user can vote on a scale from "Disagree" to "Agree",
 * and lets the user view the poll results as a histogram (votes are public).
 *
 * If a postId is provided (because we are on the post page), we record the postId as part of the vote,
 * currently this isn't used for anything directly.
 */
export const ForumEventPoll = ({
  postId,
  hideViewResults,
  classes,
  forumEventId,
  className
}: {
  postId?: string;
  hideViewResults?: boolean;
  classes: ClassesType<typeof styles>;
  forumEventId?: string;
  className?: string;
}) => {
  const { currentForumEvent, refetch: refectCurrentEvent } = useCurrentAndRecentForumEvents();
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
  const refetch = forumEventId ? refetchOverrideEvent : refectCurrentEvent;
  // Events where endDate is null always have voting open
  const votingOpen = event ? (!event.endDate || new Date(event.endDate) > new Date()) : false;

  const displayHtml = useMemo(
    () => (event?.pollQuestion?.html ? footnotesToTooltips({ html: event.pollQuestion.html, event, classes }) : null),
    [event, classes]
  );
  const plaintextQuestion = useMemo(
    () => (event?.pollQuestion?.html ? stripFootnotes(event.pollQuestion.html) : null),
    [event?.pollQuestion?.html]
  );

  const initialUserVotePos: number | null = getForumEventVoteForUser(
    event,
    currentUser
  );
  const initialBucketIndex =
    initialUserVotePos !== null
      ? Math.round(initialUserVotePos * (NUM_TICKS - 1))
      : DEFAULT_VOTE_INDEX;

  const [maxStackSize, setMaxStackSize] = useState(DEFAULT_STACK_IMAGES)

  // The bucket that the current user's vote is in (including if the vote is currently being dragged)
  const [currentBucketIndex, setCurrentBucketIndex] = useState<number>(
    initialBucketIndex
  );
  // The logical x-position of the current vote (equal to `currentBucketIndex / (NUM_TICKS - 1)`)
  const [currentUserVote, setCurrentUserVote] = useState<number | null>(
    initialUserVotePos
  );
  const hasVoted = currentUserVote !== null;
  // Whether or not the user is currently dragging their vote
  const isDragging = useRef(false);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const tickRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userVoteRef = useRef<HTMLDivElement | null>(null);

  // Whether or not the poll results (i.e. other users' votes) are visible.
  // They are hidden until the user clicks on "view results".
  const [resultsVisible, setResultsVisible] = useState(false);
  const [voteCount, setVoteCount] = useState(event?.voteCount ?? 0);

  const [commentFormOpen, setCommentFormOpen] = useState(false);

  const toggleCommentFormOpen = useCallback(() => {
    const newState = !commentFormOpen;
    captureEvent("forumEventCommentFormToggled", { newState });
    setCommentFormOpen(newState);
  }, [captureEvent, commentFormOpen])

  // Get profile image and display name for all other users who voted, to display on the slider.
  // The `useRef` is to handle `voters` being briefly undefined when refetching, which causes flickering
  const votersRef = useRef<UsersMinimumInfo[]>([])
  const { results: voters } = useMulti({
    terms: {
      view: 'usersByUserIds',
      userIds: event?.publicData
        ? Object.keys(event?.publicData)
        : [],
      limit: 1000,
    },
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
    enableTotal: false,
    skip: !event?.publicData,
  });
  const { results: comments, refetch: refetchComments } = useMulti({
    terms: {
      view: 'forumEventComments',
      forumEventId: event?._id,
      limit: 1000,
    },
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
    enableTotal: false,
    // Don't run on the first pass, to prioritise loading the user images
    skip: !event?._id || !voters,
  });

  if (voters !== undefined) {
    votersRef.current = voters;
  }

  const voteClusters = useMemo(
    () => clusterForumEventVotes({ voters: votersRef.current, comments, event: event, currentUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [votersRef.current, event, currentUser, comments]
  );

  const currentUserComment = useMemo(() => {
    return comments?.find(comment => comment.userId === currentUser?._id) || null;
  }, [comments, currentUser]);

  const [addVote] = useMutation(gql`
    mutation AddForumEventVote($forumEventId: String!, $x: Float!, $delta: Float, $postIds: [String]) {
      AddForumEventVote(forumEventId: $forumEventId, x: $x, delta: $delta, postIds: $postIds)
    }
  `);
  const [removeVote] = useMutation(gql`
    mutation RemoveForumEventVote($forumEventId: String!) {
      RemoveForumEventVote(forumEventId: $forumEventId)
    }
  `);

  /**
   * When the user clicks the "x" icon, or when a logged out user tries to vote,
   * delete their vote data
   */
  const clearVote = useCallback(
    async (e?: React.PointerEvent) => {
      try {
        if (currentUser && event) {
          await removeVote({ variables: { forumEventId: event._id } });
          setVoteCount((count) => count - 1);
          setCommentFormOpen(false);
          refetch?.();
        }
        e?.stopPropagation();
        setCurrentBucketIndex(DEFAULT_VOTE_INDEX);
        setCurrentUserVote(null);
      } catch (e) {
        flash(e.message)
      }
    },
    [currentUser, event, removeVote, refetch, flash]
  );

  /**
   * When the user pointerdowns on their vote circle, start dragging it
   */
  const startDragVote = useCallback(
    (e: React.PointerEvent) => {
      if (!votingOpen) return;
      e.preventDefault();
      isDragging.current = true;
    },
    [votingOpen]
  );

  /**
   * When the user drags their vote, update its x position
   */
  const updateVotePos = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current || !sliderRef.current || !votingOpen) return;

      const sliderRect = sliderRef.current.getBoundingClientRect();
      const sliderWidth = sliderRect.right - sliderRect.left;
      if (e.clientX < sliderRect.left) {
        setCurrentBucketIndex(0);
        return;
      } else if (e.clientX > sliderRect.right) {
        setCurrentBucketIndex(NUM_TICKS - 1);
        return;
      }

      const rawVotePos = (e.clientX - sliderRect.left) / sliderWidth;
      const bucketIndex = Math.round(rawVotePos * (NUM_TICKS - 1));
      setCurrentBucketIndex(bucketIndex);
    },
    [votingOpen]
  );
  useEventListener("pointermove", updateVotePos);

  /**
   * When the user is done dragging their vote:
   * - If the user is logged out, reset their vote and open the login modal
   * - If this is the user's initial vote, save the vote
   * - If we have a postId (because we're on the post page), save the vote
   * - Otherwise (we're on the home page), open the post selection modal
   */
  const saveVotePos = useCallback(async () => {
    if (!isDragging.current || !event || !votingOpen) return;

    isDragging.current = false;
    const newVotePos = currentBucketIndex / (NUM_TICKS - 1);

    // When a logged-in user is done dragging their vote, attempt to save it
    if (!currentUser) {
      onSignup()
      void clearVote()
      return;
    }

    try {
      const voteData: ForumEventVoteData = {
        forumEventId: event._id,
        x: newVotePos,
      };
      if (!hasVoted) {
        if (event.post) {
          setCommentFormOpen(true);
        }

        setVoteCount((count) => count + 1);
        setCurrentUserVote(newVotePos);
        await addVote({ variables: voteData });
        refetch?.();

        return;
      }
      const delta =
        newVotePos - (currentUserVote ?? (DEFAULT_VOTE_INDEX / (NUM_TICKS - 1)));
      if (delta) {
        voteData.delta = delta;
        setCurrentUserVote(newVotePos);
        await addVote({
          variables: {
            ...voteData,
            ...(postId && { postIds: [postId] }),
          },
        });
        refetch?.();
      }
    } catch (e) {
      setCurrentBucketIndex(initialBucketIndex);
      setCurrentUserVote(initialUserVotePos);
      flash(e.message);
    }
  }, [
    event,
    votingOpen,
    currentBucketIndex,
    currentUser,
    onSignup,
    clearVote,
    hasVoted,
    currentUserVote,
    addVote,
    refetch,
    postId,
    initialBucketIndex,
    initialUserVotePos,
    flash
  ]);
  useEventListener("pointerup", saveVotePos);

  const { ForumIcon, LWTooltip, UsersProfileImage, ForumEventCommentForm, ForumEventResultIcon } = Components;

  const ticks = Array.from({ length: NUM_TICKS }, (_, i) => i);

  const tickPositions = useRef<number[]>([]);

  // Get the exact positions of the ticks on the slider after they have rendered, in order
  // to place the user vote without having to account for spacing etc
  useEffect(() => {
    if (sliderRef.current) {
      const sliderRect = sliderRef.current.getBoundingClientRect();
      tickPositions.current = tickRefs.current.map((tick) => {
        if (tick) {
          const tickRect = tick.getBoundingClientRect();
          return (
            ((tickRect.left + (tickRect.width / 2) - sliderRect.left) /
              sliderRect.width) *
            100
          );
        }
        return 0;
      });
    }
  }, [currentBucketIndex]);

  // The position of the current vote as a percentage along the slider
  const votePos =
    tickPositions.current.length && tickPositions.current[currentBucketIndex] !== undefined
      ? tickPositions.current[currentBucketIndex]
      // Fall back to naive approximate calculation so there isn't a big jump after the first render
      : (currentBucketIndex / (NUM_TICKS - 1)) * 100;

  if (!event) return null;

  const commentPrefilledProps: PartialDeep<DbComment> = !currentUserComment && currentUserVote !== null ? {
    forumEventMetadata: {
      eventFormat: "POLL",
      sticker: null,
      poll: {
        voteWhenPublished: currentUserVote,
        latestVote: null,
        pollQuestionWhenPublished: event.pollQuestion?._id ?? null
      }
    },
    ...(!event.isGlobal && {
      contents: {
        originalContents: {
          type: "ckEditorMarkup",
          data: `<blockquote>${plaintextQuestion}</blockquote><p></p>`,
        }
      }
    }),
  } : {};

  return (
    <AnalyticsContext pageElementContext="forumEventPoll">
      <div className={classNames(classes.root, className)}>
        {displayHtml && <div className={classes.question}>{displayHtml}</div>}
        <div className={classes.votePromptWrapper}>
          <DeferRender ssr={false}>
            {!hideViewResults && (
              <div className={classes.votePrompt}>
                {!resultsVisible ? <>
                  {voteCount > 0 && `${voteCount} vote${voteCount === 1 ? "" : "s"}${votingOpen ? " so far" : ""}. `}
                  {votingOpen ? (
                    hasVoted ? "Click and drag your avatar to change your vote, or " : "Place your vote or "
                  ) : (
                    "Voting has now closed, "
                  )}
                  <button className={classes.viewResultsButton} onClick={() => setResultsVisible(true)}>
                    view results.
                  </button>
                </> : <button
                  className={classNames(classes.viewResultsButton, classes.hideResultsButton)}
                  onClick={() => setResultsVisible(false)}
                >
                  Hide results
                </button>}
              </div>
            )}
          </DeferRender>
        </div>
        <div className={classes.sliderRow}>
          <div className={classes.sliderLineCol}>
            <div
              className={classes.sliderLineResults}
              style={{ maxHeight: resultsVisible ? maxStackSize * RESULT_ICON_MAX_HEIGHT : 0, opacity: resultsVisible ? 1 : 0 }}
            >
              {voteClusters.map((cluster) => (
                <div key={cluster.center} className={classes.voteCluster}>
                  {cluster.votes.length > maxStackSize && (
                    <div className={classes.extraVotesCircle} onClick={() => setMaxStackSize((prev) => prev + 10)}>
                      <span className={classes.extraVotesText}>+{cluster.votes.length - maxStackSize}</span>
                    </div>
                  )}
                  {cluster.votes.slice(-maxStackSize).map((vote) => (
                    <ForumEventResultIcon
                      key={vote.user._id}
                      vote={vote}
                      tooltipDisabled={!resultsVisible}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className={classes.sliderLine} ref={sliderRef}>
              {/* Ticks */}
              <div className={classes.ticksContainer}>
                {ticks.map((tickIndex) => (
                  <div
                    key={tickIndex}
                    ref={(el) => (tickRefs.current[tickIndex] = el)}
                    className={classNames(
                      classes.tick,
                      isDragging.current && classes.tickDragging,
                      tickIndex === Math.floor(NUM_TICKS / 2) && classes.centralTick
                    )}
                  />
                ))}
                {/* User Vote */}
                <AnalyticsContext
                  pageElementContext="forumEventUserIcon"
                  forumEventId={event?._id}
                >
                  <div
                    ref={userVoteRef}
                    className={classNames(
                      classes.userVote,
                      classes.currentUserVote,
                      !votingOpen && classes.currentUserVoteClosed,
                      isDragging.current && classes.currentUserVoteDragging,
                      hasVoted && classes.currentUserVoteActive
                    )}
                    onPointerDown={startDragVote}
                    style={{
                      left: `${votePos}%`,
                    }}
                  >
                    <LWTooltip
                      title={
                        (votingOpen && !hasVoted) && (
                          <>
                            <div className={classes.voteTooltipHeading}>Click and drag to vote</div>
                            <div className={classes.voteTooltipBody}>
                              Votes are non-anonymous and can be changed at any time
                            </div>
                          </>
                        )
                      }
                      disabled={commentFormOpen}
                    >
                      {currentUser ? (
                        <UsersProfileImage user={currentUser} size={USER_IMAGE_SIZE} className={classes.userImage} />
                      ) : (
                        <ForumIcon icon="UserCircle" className={classes.placeholderUserIcon} />
                      )}
                      {votingOpen && (
                        <div
                          className={classNames(classes.iconButton, classes.clearVote)}
                          onPointerDown={clearVote}
                        >
                          <ForumIcon icon="Close" />
                        </div>
                      )}
                      {event.post && <div
                        className={classNames(classes.iconButton, classes.toggleCommentForm)}
                        onClick={toggleCommentFormOpen}
                      >
                        <ForumIcon icon="Comment" />
                      </div>}
                    </LWTooltip>
                  </div>
                  {/* Popper containing the form for creating a comment */}
                  {event.post && (
                    <ForumEventCommentForm
                      open={commentFormOpen}
                      comment={currentUserComment}
                      prefilledProps={commentPrefilledProps}
                      successMessage="Success! Open the results to view everyone's votes and comments."
                      forumEvent={event}
                      cancelCallback={() => setCommentFormOpen(false)}
                      successCallback={refetchComments}
                      anchorEl={userVoteRef.current}
                      post={event.post}
                      title="What made you vote this way?"
                      subtitle={(post, comment) => (<>
                        <div>
                          Your response will appear as a comment on{" "}
                          {event.isGlobal ? <Link to={comment ? commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id}) : postGetPageUrl(post)} target="_blank" rel="noopener noreferrer">
                            this Debate Week post
                          </Link> : 'this post'}
                          , and show next to your avatar in the results.
                        </div>
                      </>)}
                    />
                  )}
                </AnalyticsContext>
              </div>
              {/* Arrows */}
              <ForumIcon icon="ChevronLeft" className={classNames(classes.sliderArrow, classes.sliderArrowLeft)} />
              <ForumIcon icon="ChevronRight" className={classNames(classes.sliderArrow, classes.sliderArrowRight)} />
            </div>
            <div className={classes.sliderLabels}>
              <div>{event.pollDisagreeWording}</div>
              <div>{event.pollAgreeWording}</div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const ForumEventPollComponent = registerComponent(
  "ForumEventPoll",
  ForumEventPoll,
  {styles}
);

declare global {
  interface ComponentTypes {
    ForumEventPoll: typeof ForumEventPollComponent
  }
}
