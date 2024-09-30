import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { useCurrentUser } from "../common/withUser";
import { useEventListener } from "../hooks/useEventListener";
import { gql, useMutation } from "@apollo/client";
import { useMulti } from "@/lib/crud/withMulti";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import range from "lodash/range";
import sortBy from "lodash/sortBy";
import DeferRender from "../common/DeferRender";

export const POLL_MAX_WIDTH = 730;
const SLIDER_MAX_WIDTH = 1100;
const USER_IMAGE_SIZE = 28;
const MAX_STACK_IMAGES = 20;
const NUM_TICKS = 33;
const GAP = 8;

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: "center",
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "10px 30px 40px 30px",
    margin: "0 auto",
    maxWidth: "100%",
    [`@media (max-width: ${POLL_MAX_WIDTH}px)`]: {
      display: "none",
    },
  },
  question: {
    fontSize: 32,
    lineHeight: "110%",
    fontWeight: 700,
    marginBottom: 36, // Adjusted to provide space for clusters
  },
  questionFootnote: {
    fontSize: 20,
    verticalAlign: "super",
  },
  sliderRow: {
    display: "flex",
    justifyContent: "center",
  },
  sliderLineCol: {
    flexGrow: 1,
    maxWidth: `min(${SLIDER_MAX_WIDTH}px, 100%)`,
  },
  sliderLineResults: {
    display: "flex",
    justifyContent: "space-between",
    gap: `${GAP}px`,
    marginBottom: USER_IMAGE_SIZE / 2 + 8,
    maxWidth: "100%",
  },
  voteCluster: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  voteCircle: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    width: "100%",
    marginTop: -5,
    zIndex: 1,
    [theme.breakpoints.down('sm')]: {
      marginTop: -3,
    },
  },
  extraVotesCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    borderRadius: "50%",
    fontWeight: "bold",
    width: "calc(100% + 4px)",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    position: "relative",
  },
  // Inner element needed so that extraVotesCircle can't can't expand horizontal
  extraVotesText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-54%, -54%)",
    fontSize: 14,
    overflow: "hidden",
    textOverflow: "ellipsis",
    [theme.breakpoints.down('sm')]: {
      fontSize: 10,
    },
  },
  sliderLine: {
    position: "relative",
    width: "100%",
    height: 2,
    backgroundColor: theme.palette.text.alwaysWhite,
    marginBottom: "16px",
  },
  sliderLineHoverArea: {
    position: "relative",
    width: "100%",
    height: USER_IMAGE_SIZE,
    '&:hover $tick': {
      opacity: 1,
    },
  },
  ticksContainer: {
    position: "absolute",
    top: -6,
    left: 0,
    right: 0,
    height: 12,
    display: "flex",
    gap: `${GAP}px`
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
      backgroundColor: theme.palette.text.alwaysWhite,
      opacity: 0.3,
      transform: "translateX(-50%)",
    },
    opacity: 0,
    transition: "opacity 0.2s",
  },
  centralTick: {
    opacity: 0.3,
    '&::before': {
      height: "150%",
      top: "-25%",
      bottom: "-25%",
      backgroundColor: theme.palette.text.alwaysWhite,
      opacity: 1,
    },
  },
  sliderArrow: {
    stroke: theme.palette.text.alwaysWhite,
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
    lineHeight: "140%",
    marginBottom: 4,
  },
  voteTooltipBody: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "140%",
  },
  userImage: {
    outline: `2px solid ${theme.palette.text.alwaysWhite}`,
  },
  userResultsImage: {
    width: "100% !important",
    height: "unset !important",
  },
  userImageBoxShadow: {
    boxShadow: theme.palette.boxShadow.eaCard,
  },
  placeholderUserIcon: {
    background: `radial-gradient(${theme.palette.text.alwaysBlack} 50%, transparent 50%)`,
    color: theme.palette.text.alwaysWhite,
    fontSize: 34,
    borderRadius: "50%",
    marginLeft: -5,
  },
  clearVote: {
    display: "none",
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: `color-mix(in oklab, ${theme.palette.text.alwaysBlack} 65%, ${theme.palette.text.alwaysWhite} 35%)`,
    padding: 2,
    borderRadius: "50%",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.text.alwaysBlack,
    },
  },
  clearVoteIcon: {
    fontSize: 10,
  },
  sliderLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "normal",
    marginTop: 22,
  },
  viewResultsButton: {
    background: "none",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "normal",
    color: theme.palette.text.alwaysWhite,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    padding: 0,
    "&:hover": {
      opacity: 0.7,
    },
  },
  userVote: {
    position: "absolute",
    top: -USER_IMAGE_SIZE / 2,
    zIndex: 10,
  },
  currentUserVote: {
    opacity: 0.6,
    cursor: "grab",
    zIndex: 15,
    touchAction: "none",
    "&:hover": {
      opacity: 1,
    },
  },
  currentUserVoteDragging: {
    cursor: "grabbing",
  },
  currentUserVotePlaceholder: {
    top: -(USER_IMAGE_SIZE / 2) - 5,
  },
  currentUserVoteActive: {
    opacity: 1,
    "&:hover .ForumEventPoll-clearVote": {
      display: "flex",
    },
  },
});

export type ForumEventVoteData = {
  forumEventId: string;
  x: number;
  delta?: number;
  postIds?: string[];
};

export const addForumEventVoteQuery = gql`
  mutation AddForumEventVote(
    $forumEventId: String!
    $x: Float!
    $delta: Float
    $postIds: [String]
  ) {
    AddForumEventVote(
      forumEventId: $forumEventId
      x: $x
      delta: $delta
      postIds: $postIds
    )
  }
`;
const removeForumEventVoteQuery = gql`
  mutation RemoveForumEventVote($forumEventId: String!) {
    RemoveForumEventVote(forumEventId: $forumEventId)
  }
`;

const defaultVoteIndex = Math.floor(NUM_TICKS / 2);

export const getForumEventVoteForUser = (
  event?: ForumEventsDisplay | null,
  user?: UsersMinimumInfo | null
): number | null => {
  return user ? event?.publicData?.[user._id]?.x ?? null : null;
};

type ForumEventVoteDisplayCluster = {
  center: number;
  votes: ForumEventVoteDisplay[];
};
type ForumEventVoteDisplay = {
  x: number;
  user: UserOnboardingAuthor;
};

const clusterForumEventVotes = (
  voters?: UserOnboardingAuthor[],
  event?: ForumEventsDisplay | null
): ForumEventVoteDisplayCluster[] => {
  if (!voters || !event || !event.publicData) return [];

  let votes = voters.map((voter) => {
    const vote = event.publicData[voter._id].x;
    return {
      x: vote,
      user: voter,
    };
  });
  votes = sortBy(votes, "x");

  const clusters: ForumEventVoteDisplayCluster[] = range(0, NUM_TICKS).map(
    (i) => ({
      center: i / (NUM_TICKS - 1),
      votes: [],
    })
  );
  votes.forEach((vote) => {
    const adjustedX = Math.min(vote.x, 0.999999);
    const clusterIndex = Math.floor(adjustedX * NUM_TICKS);
    clusters[clusterIndex].votes.push(vote);
  });
  return clusters;
};

const PollQuestion = ({
  event,
  classes,
}: {
  event: ForumEventsDisplay;
  classes: ClassesType<typeof styles>;
}) => {
  const { LWTooltip } = Components;

  return (
    <div className={classes.question}>
      “AI welfare
      <LWTooltip
        title="
            By “AI welfare”, we mean the potential wellbeing (pain,
            pleasure, but also frustration, satisfaction etc...) of
            future artificial intelligence systems.
          "
      >
        <span
          className={classes.questionFootnote}
          style={{ color: event.contrastColor ?? event.darkColor }}
        >
          1
        </span>
      </LWTooltip>{" "}
      should be an EA priority
      <LWTooltip
        title="
            By “EA priority” we mean that 5% of (unrestricted, i.e.
            open to EA-style cause prioritisation) talent and 5% of
            (unrestricted, i.e. open to EA-style cause prioritisation)
            funding should be allocated to this cause.
          "
      >
        <span
          className={classes.questionFootnote}
          style={{ color: event.contrastColor ?? event.darkColor }}
        >
          2
        </span>
      </LWTooltip>
      ”
    </div>
  );
};

export const ForumEventPoll = ({
  postId,
  hideViewResults,
  classes,
}: {
  postId?: string;
  hideViewResults?: boolean;
  classes: ClassesType<typeof styles>;
}) => {
  const { currentForumEvent: event, refetch } = useCurrentForumEvent();
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();

  const initialUserVotePos: number | null = getForumEventVoteForUser(
    event,
    currentUser
  );
  const initialBucketIndex =
    initialUserVotePos !== null
      ? Math.round(initialUserVotePos * (NUM_TICKS - 1))
      : defaultVoteIndex;
  const [currentBucketIndex, setCurrentBucketIndex] = useState<number>(
    initialBucketIndex
  );
  const [currentUserVote, setCurrentUserVote] = useState<number | null>(
    initialUserVotePos
  );
  const hasVoted = currentUserVote !== null;
  const isDragging = useRef(false);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const tickRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [resultsVisible, setResultsVisible] = useState(false);
  const [voteCount, setVoteCount] = useState(event?.voteCount ?? 0);

  const { results: voters } = useMulti({
    terms: {
      view: "usersByUserIds",
      userIds: event?.publicData
        ? Object.keys(event?.publicData).filter(
            (userId) => userId !== currentUser?._id
          )
        : [],
      limit: 500,
    },
    collectionName: "Users",
    fragmentName: "UserOnboardingAuthor",
    enableTotal: false,
    skip: !event?.publicData,
  });
  const voteClusters = useMemo(
    () => clusterForumEventVotes(voters, event),
    [voters, event]
  );

  const [addVote] = useMutation(addForumEventVoteQuery);
  const [removeVote] = useMutation(removeForumEventVoteQuery);

  const clearVote = useCallback(
    async (e?: React.PointerEvent) => {
      e?.stopPropagation();
      setCurrentBucketIndex(defaultVoteIndex);
      setCurrentUserVote(null);
      if (currentUser && event) {
        setVoteCount((count) => count - 1);
        await removeVote({ variables: { forumEventId: event._id } });
        refetch?.();
      }
    },
    [
      setCurrentBucketIndex,
      setCurrentUserVote,
      currentUser,
      removeVote,
      event,
      refetch,
    ]
  );

  const startDragVote = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
    },
    []
  );

  const updateVotePos = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current || !sliderRef.current) return;

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
      const bucketIndex = Math.round(
        rawVotePos * (NUM_TICKS - 1)
      );
      setCurrentBucketIndex(bucketIndex);
    },
    []
  );
  useEventListener("pointermove", updateVotePos);

  const saveVotePos = useCallback(async () => {
    if (!isDragging.current || !event) return;

    isDragging.current = false;
    const newVotePos = currentBucketIndex / (NUM_TICKS - 1);

    if (currentUser) {
      const voteData: ForumEventVoteData = {
        forumEventId: event._id,
        x: newVotePos,
      };
      if (!hasVoted) {
        setVoteCount((count) => count + 1);
        setCurrentUserVote(newVotePos);
        await addVote({ variables: voteData });
        refetch?.();
        return;
      }
      const delta =
        newVotePos -
        (currentUserVote ?? defaultVoteIndex / (NUM_TICKS - 1));
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
    } else {
      onSignup();
      void clearVote();
    }
  }, [
    currentBucketIndex,
    currentUser,
    addVote,
    event,
    currentUserVote,
    postId,
    setCurrentUserVote,
    onSignup,
    clearVote,
    refetch,
    hasVoted,
  ]);
  useEventListener("pointerup", saveVotePos);

  const { ForumIcon, LWTooltip, UsersProfileImage } = Components;

  const ticks = Array.from({ length: NUM_TICKS }, (_, i) => i);

  // Calculate user vote position
  const tickPositions = useRef<number[]>([]);
  const [votePos, setVotePos] = useState(
    (currentBucketIndex / (NUM_TICKS - 1)) * 100 // Initial naive calculation
  );

  useEffect(() => {
    if (sliderRef.current) {
      const sliderRect = sliderRef.current.getBoundingClientRect();
      tickPositions.current = tickRefs.current.map((tick) => {
        if (tick) {
          const tickRect = tick.getBoundingClientRect();
          return (
            ((tickRect.left + tickRect.width / 2 - sliderRect.left) /
              sliderRect.width) *
            100
          );
        }
        return 0;
      });
      setVotePos(tickPositions.current[currentBucketIndex]);
    }
  }, [currentBucketIndex]);

  useEffect(() => {
    if (tickPositions.current.length && tickPositions.current[currentBucketIndex] !== undefined) {
      setVotePos(tickPositions.current[currentBucketIndex]);
    }
  }, [currentBucketIndex]);

  if (!event) return null;

  return (
    <AnalyticsContext pageElementContext="forumEventPoll">
      <div className={classes.root}>
        <PollQuestion event={event} classes={classes} />

        <div className={classes.sliderRow}>
          <div className={classes.sliderLineCol}>
            {resultsVisible && (
              <div className={classes.sliderLineResults}>
                {voteClusters.map((cluster) => (
                  <div key={cluster.center} className={classes.voteCluster}>
                    {cluster.votes.length > MAX_STACK_IMAGES && (
                      <div className={classes.extraVotesCircle}>
                        <span className={classes.extraVotesText}>
                          +{cluster.votes.length - MAX_STACK_IMAGES}
                        </span>
                      </div>
                    )}
                    {cluster.votes
                      .slice(0, MAX_STACK_IMAGES)
                      .map((vote) => (
                        <div
                          key={vote.user._id}
                          className={classes.voteCircle}
                        >
                          <LWTooltip
                            title={
                              <div className={classes.voteTooltipBody}>
                                {vote.user.displayName}
                              </div>
                            }
                          >
                            <UsersProfileImage
                              user={vote.user}
                              size={USER_IMAGE_SIZE}
                              className={classNames(
                                classes.userImage,
                                classes.userResultsImage,
                                classes.userImageBoxShadow
                              )}
                            />
                          </LWTooltip>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
            <div className={classes.sliderLine} ref={sliderRef}>
              {/* Ticks */}
              <div className={classes.sliderLineHoverArea}>
                <div className={classes.ticksContainer}>
                  {ticks.map((tickIndex) => (
                    <div
                      key={tickIndex}
                      ref={(el) => (tickRefs.current[tickIndex] = el)}
                      className={classNames(
                        classes.tick,
                        tickIndex === Math.floor(NUM_TICKS / 2) &&
                          classes.centralTick
                      )}
                    />
                  ))}
                </div>
                {/* User Vote */}
                <div
                  className={classNames(
                    classes.userVote,
                    classes.currentUserVote,
                    !currentUser && classes.currentUserVotePlaceholder,
                    isDragging.current && classes.currentUserVoteDragging,
                    hasVoted && classes.currentUserVoteActive
                  )}
                  onPointerDown={startDragVote}
                  style={{
                    left: `${votePos}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <LWTooltip
                    title={
                      hasVoted ? (
                        <div className={classes.voteTooltipBody}>
                          Drag to move
                        </div>
                      ) : (
                        <>
                          <div className={classes.voteTooltipHeading}>
                            Click and drag to vote
                          </div>
                          <div className={classes.voteTooltipBody}>
                            Votes are non-anonymous and can be changed at any time
                          </div>
                        </>
                      )
                    }
                  >
                    {currentUser ? (
                      <UsersProfileImage
                        user={currentUser}
                        size={USER_IMAGE_SIZE}
                        className={classes.userImage}
                      />
                    ) : (
                      <ForumIcon
                        icon="UserCircle"
                        className={classes.placeholderUserIcon}
                      />
                    )}
                    <div
                      className={classes.clearVote}
                      onPointerDown={clearVote}
                    >
                      <ForumIcon
                        icon="Close"
                        className={classes.clearVoteIcon}
                      />
                    </div>
                  </LWTooltip>
                </div>
              </div>
              {/* Arrows */}
              <ForumIcon
                icon="ChevronLeft"
                className={classNames(
                  classes.sliderArrow,
                  classes.sliderArrowLeft
                )}
              />
              <ForumIcon
                icon="ChevronRight"
                className={classNames(
                  classes.sliderArrow,
                  classes.sliderArrowRight
                )}
              />
            </div>
            <div className={classes.sliderLabels}>
              <div>Disagree</div>
              <DeferRender ssr={false}>
                {!hideViewResults && !resultsVisible && (
                  <div>
                    {voteCount > 0 &&
                      `${voteCount} vote${voteCount === 1 ? "" : "s"} so far. `}
                    {hasVoted
                      ? "Click and drag your avatar to change your vote, or "
                      : "Place your vote or "}
                    <button
                      className={classes.viewResultsButton}
                      onClick={() => setResultsVisible(true)}
                    >
                      view results
                    </button>
                  </div>
                )}
              </DeferRender>
              <div>Agree</div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
};

const ForumEventPollComponent = registerComponent(
  "ForumEventPoll",
  ForumEventPoll,
  { styles }
);

declare global {
  interface ComponentTypes {
    ForumEventPoll: typeof ForumEventPollComponent;
  }
}
