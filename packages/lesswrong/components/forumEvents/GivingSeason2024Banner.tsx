import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrl } from "@/lib/collections/comments/helpers";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { formatStat } from "../users/EAUserTooltipContent";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from "../common/Header";
import {
  GIVING_SEASON_DESKTOP_WIDTH,
  GIVING_SEASON_MD_WIDTH,
  GIVING_SEASON_MOBILE_WIDTH,
  useGivingSeasonEvents,
} from "./useGivingSeasonEvents";
import classNames from "classnames";
import moment from "moment";
import type { Moment } from "moment";
import type { ForumIconName } from "../common/ForumIcon";
import { GivingSeasonHeart } from "../review/ReviewVotingCanvas";
import { gql, useMutation } from "@apollo/client";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import { useMulti } from "@/lib/crud/withMulti";
import { useCurrentUser } from "../common/withUser";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";

const DOT_SIZE = 12;

/** Style to pass pointer events through one element, but not have this affect all children */
const PASS_THROUGH_POINTER_EVENTS = {
  pointerEvents: "none",
  "& > *": {
    pointerEvents: "all",
  },
}

// TODO:
// - Potentially mess with the header bar, to allow placing hearts there

// Notes (TODO remove):
// - coords should be normalised, the reference is the div with class GivingSeason2024Banner-root
// - when displaying, stick the hearts to the eventDetails container for the Donation Celebration
//   - This means
//
const DEBUG_HEARTS: GivingSeasonHeart[] = [
  { userId: "1", displayName: "User1", x: 0, y: 0, theta: 0 },
  { userId: "2", displayName: "User2", x: 0.5, y: 0, theta: 0 },
  { userId: "3", displayName: "User3", x: 1, y: 0, theta: 0 },
  { userId: "4", displayName: "User4", x: 0, y: 0.5, theta: 0 },
  { userId: "5", displayName: "User5", x: 0.5, y: 0.5, theta: 0 },
  { userId: "6", displayName: "User6", x: 1, y: 0.5, theta: 0 },
  { userId: "7", displayName: "User7", x: 0, y: 1, theta: 0 },
  { userId: "8", displayName: "User8", x: 0.5, y: 1, theta: 0 },
  { userId: "9", displayName: "User9", x: 1, y: 1, theta: 0 }
];

const styles = (theme: ThemeType) => ({
  root: {
    width: "100vw",
    maxWidth: "100vw",
    overflow: "hidden",
    position: "relative",
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    marginTop: -HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
    [theme.breakpoints.down("xs")]: {
      marginTop: -MOBILE_HEADER_HEIGHT,
      paddingTop: MOBILE_HEADER_HEIGHT,
    },
  },
  backgrounds: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    background: theme.palette.text.alwaysWhite,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    transition: "opacity 0.5s ease",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundBlendMode: "darken",
    overflow: "hidden"
  },
  backgroundActive: {
    opacity: 1,
  },
  darkText: {
    color: theme.palette.givingSeason.primary,
    "& $line, & $timelineDot": {
      background: theme.palette.givingSeason.primary,
    },
  },
  banner: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: "150%",
    letterSpacing: "0.98px",
    textAlign: "center",
    margin: "-4px 0 16px 0",
    [theme.breakpoints.up(GIVING_SEASON_MOBILE_WIDTH)]: {
      display: "none",
    },
  },
  content: {
    transition: "color 0.5s ease",
    maxWidth: GIVING_SEASON_DESKTOP_WIDTH - 10,
    margin: "0 auto",
  },
  line: {
    width: "100%",
    height: 1,
    opacity: 0.6,
    background: theme.palette.text.alwaysWhite,
    transition: "background 0.5s ease",
  },
  timeline: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    paddingTop: 14,
    marginTop: -12,
    overflow: "scroll hidden",
    scrollbarWidth: "none",
    "-ms-overflow-style": "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    [theme.breakpoints.down(GIVING_SEASON_DESKTOP_WIDTH)]: {
      paddingLeft: 24,
      paddingRight: 24,
    },
  },
  timelineEvent: {
    cursor: "pointer",
    position: "relative",
    margin: "12px 0",
    fontWeight: 400,
    whiteSpace: "nowrap",
    userSelect: "none",
    opacity: 0.6,
    transition: "opacity 0.5s ease",
    "&:hover": {
      opacity: 1,
    },
    // Use `after` to overlay the same text but with the higher font weight as
    // if it's selected, even if it's not. This means that the size of each
    // title won't change when they switch between active/inactive.
    "&:after": {
      display: "block",
      content: "attr(data-title)",
      fontWeight: 600,
      height: 1,
      color: "transparent",
      overflow: "hidden",
      visibility: "hidden",
    },
    "&:first-child": {
      scrollMarginLeft: "1000px",
    },
    "&:last-child": {
      scrollMarginRight: "1000px",
    },
  },
  timelineEventSelected: {
    fontWeight: 600,
    opacity: 1,
  },
  timelineDot: {
    position: "absolute",
    top: -20.5,
    left: `calc(50% - ${DOT_SIZE / 2}px)`,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: "50%",
    background: theme.palette.text.alwaysWhite,
    transition: "background 0.5s ease",
  },
  mainContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    alignItems: "center",
    [theme.breakpoints.down(GIVING_SEASON_DESKTOP_WIDTH)]: {
      padding: "0 24px",
    },
    [theme.breakpoints.down(GIVING_SEASON_MOBILE_WIDTH)]: {
      flexDirection: "column",
    },
  },
  detailsContainer: {
    transition: "max-height ease-in-out 0.35s",
    maxHeight: 500,
    width: "100%",
    whiteSpace: "nowrap",
    overflow: "scroll hidden",
    scrollSnapType: "x mandatory",
    scrollbarWidth: "none",
    "-ms-overflow-style": "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  detailsContainerHidden: {
    minHeight: 1,
    maxHeight: 1,
  },
  eventDetails: {
    ...PASS_THROUGH_POINTER_EVENTS,
    position: "relative",
    display: "inline-flex",
    verticalAlign: "middle",
    width: "100%",
    scrollSnapAlign: "start",
    paddingTop: 24,
    paddingBottom: 40,
    [theme.breakpoints.down(GIVING_SEASON_MOBILE_WIDTH)]: {
      paddingTop: 8,
      paddingBottom: 8,
    },
    [theme.breakpoints.up(GIVING_SEASON_DESKTOP_WIDTH)]: {
      "& > *": {
        flexBasis: "50%",
      },
    },
  },
  simpleEventContainer: {
    ...PASS_THROUGH_POINTER_EVENTS,
    flexGrow: 1,
  },
  eventDate: {
    maxWidth: 470,
    marginBottom: 8,
  },
  eventName: {
    maxWidth: 640,
    fontSize: 40,
    fontWeight: 700,
    marginBottom: 12,
    whiteSpace: "wrap",
    [theme.breakpoints.down(GIVING_SEASON_MOBILE_WIDTH)]: {
      fontSize: 32,
    },
  },
  eventDescription: {
    maxWidth: 470,
    lineHeight: "140%",
    whiteSpace: "wrap",
    marginBottom: 16,
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  hideAboveMobile: {
    [theme.breakpoints.up(GIVING_SEASON_MOBILE_WIDTH)]: {
      display: "none !important",
    },
  },
  hideAboveMd: {
    [theme.breakpoints.up(GIVING_SEASON_MD_WIDTH)]: {
      display: "none !important",
    },
  },
  hideBelowMd: {
    [theme.breakpoints.down(GIVING_SEASON_MD_WIDTH)]: {
      display: "none !important",
    },
  },
  button: {
    flexGrow: 1,
    fontSize: 14,
    fontWeight: 600,
    transition: "background 0.3s ease",
    textAlign: "center",
  },
  buttonLarge: {
    padding: "12px 24px",
    [theme.breakpoints.down(GIVING_SEASON_MOBILE_WIDTH)]: {
      padding: "8px 12px",
    },
  },
  buttonTranslucentDisabled: {
    cursor: "not-allowed",
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.givingSeason.electionFundBackground,
    "&:hover": {
      background: theme.palette.givingSeason.electionFundBackground,
    },
    "& > *": {
      opacity: 0.5,
    },
  },
  fundVoteButton: {
    width: "100%",
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.givingSeason.electionFundBackground,
    transition: "background 0.3s ease",
    "&:hover": {
      background: theme.palette.givingSeason.electionFundBackgroundHeavy,
    },
  },
  topPosts: {
    marginLeft: 16,
    [theme.breakpoints.down(GIVING_SEASON_MD_WIDTH)]: {
      display: "none",
    },
  },
  topPostsTitle: {
    marginBottom: 4,
    fontSize: 18,
    fontWeight: 600,
  },
  topPostsFeed: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    margin: "12px 0",
    minWidth: 530,
    maxWidth: 600,
  },
  topPostsViewMore: {
    fontSize: 15,
    fontWeight: 600,
  },
  feedItem: {
    display: "flex",
    gap: "8px",
    fontSize: 14,
    lineHeight: "140%",
    padding: 8,
    borderRadius: theme.borderRadius.default,
    cursor: "pointer",
    background: theme.palette.givingSeason.electionFundBackground,
    "&:hover": {
      opacity: 0.8,
    },
  },
  feedDetailsWrapper: {
    minWidth: 0,
    width: "100%",
  },
  feedUser: {
    fontWeight: 600,
  },
  feedInfo: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 2,
  },
  feedPost: {
    fontSize: 16,
    fontWeight: 600,
  },
  feedMeta: {
    color: theme.palette.text.alwaysWhite,
    fontWeight: 500,
    opacity: 0.7,
  },
  feedInteraction: {
    display: "inline",
  },
  electionInfoContainer: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    padding: "0px 48px 0px 0px",
    borderRadius: theme.borderRadius.default,
    width: 600,
    maxWidth: "100%",
    margin: "0 auto 0 0",
    flexBasis: "35%",
    [theme.breakpoints.down(GIVING_SEASON_MOBILE_WIDTH)]: {
      padding: 0,
      flex: 1
    },
  },
  eventHidden: {
    display: "none",
  },
  electionRaised: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 16,
  },
  electionInfoButtonContainer: {
    marginBottom: 4,
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    width: "100%",
    [theme.breakpoints.down(GIVING_SEASON_MOBILE_WIDTH)]: {
      marginBottom: 16
    },
  },
  heartsContainer: {
    width: "100%",
    height: "100%",
    position: "absolute"
  },
  heart: {
    color: theme.palette.givingSeason.heart,
    width: 20,
    height: 20,
    position: "absolute",
    transformOrigin: "center",
    // TODO probably smaller on mobile
  },
  hoverHeart: {
    opacity: 0.5,
    pointerEvents: "none",
  },
});

const addForumEventStickerQuery = gql`
  mutation AddForumEventSticker($forumEventId: String!, $x: Float!, $delta: Float, $postIds: [String]) {
    AddForumEventSticker(forumEventId: $forumEventId, x: $x, y: $y, theta: $theta)
  }
`;
const removeForumEventStickerQuery = gql`
  mutation RemoveForumEventSticker($forumEventId: String!) {
    RemoveForumEventSticker(forumEventId: $forumEventId)
  }
`;


type ForumEventStickerData = Record<
  string,
  {
    x: number;
    y: number;
    theta: number;
  }
>;

type ForumEventStickerDisplay = {
  x: number;
  y: number;
  theta: number;
  user: UsersMinimumInfo;
  comment: ShortformComments | null;
};

function stickerDataToArray({
  data,
  users,
  comments,
}: {
  data: ForumEventStickerData;
  users: UsersMinimumInfo[];
  comments: ShortformComments[] | undefined;
}): ForumEventStickerDisplay[] {
  if (!users || !comments) {
    return [];
  }

  return users
    .map((user) => {
      const sticker = data[user._id];

      if (!sticker) return undefined;

      const comment = comments?.find(comment => comment.userId === user._id) || null

      return {
        x: sticker.x,
        y: sticker.y,
        theta: sticker.theta,
        user,
        comment,
      };
    })
    .filter((sticker) => !!sticker) as ForumEventStickerDisplay[];
}

const Hearts: FC<{
  classes: ClassesType<typeof styles>;
}> = ({ classes }) => {
  const { ForumIcon, ForumEventCommentForm } = Components;

  const { currentForumEvent, refetch } = useCurrentForumEvent();
  // TODO merge with ForumEventPoll
  const { onSignup } = useLoginPopoverContext();
  const currentUser = useCurrentUser();

  const stickerData: ForumEventStickerData | null = currentForumEvent?.publicData || null;

  const { results: users } = useMulti({
    terms: {
      view: 'usersByUserIds',
      userIds: stickerData
        ? Object.keys(stickerData)
        : [],
      limit: 1000,
    },
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
    enableTotal: false,
    skip: !stickerData,
  });
  const { results: comments, refetch: refetchComments } = useMulti({
    terms: {
      view: 'forumEventComments',
      forumEventId: currentForumEvent?._id,
      limit: 1000,
    },
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
    enableTotal: false,
    // Don't run on the first pass, to speed up SSR
    skip: !currentForumEvent?._id || !users,
  });

  const hearts = useMemo(
    () => (users && stickerData ? stickerDataToArray({ data: stickerData, users, comments }) : []),
    [comments, stickerData, users]
  );

  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [placedHearts, setPlacedHearts] = useState<
    { x: number; y: number; theta: number }[]
  >([]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizeCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        if (
          clientX > bounds.left &&
          clientX < bounds.right &&
          clientY > bounds.top &&
          clientY < bounds.bottom
        ) {
          return {
            x: (clientX - bounds.left) / bounds.width,
            y: (clientY - bounds.top) / bounds.height,
          };
        }
      }
      return null;
    },
    [containerRef]
  );

  const [addSticker] = useMutation(addForumEventStickerQuery);
  const [removeSticker] = useMutation(removeForumEventStickerQuery);

  const saveStickerPos = useCallback(async (event: React.MouseEvent) => {
    // When a logged-in user is done dragging their vote, attempt to save it
    if (currentUser) {
      // TODO handle null event more gracefully
      const coords = normalizeCoords(event.clientX, event.clientY);

      if (!coords) return;

      const theta = (Math.random() * 50) - 25; // Random rotation between -25 and 25 degrees
      const hasVoted = false; // TODO handle hasPlacedSticker properly
      if (!hasVoted) {
        // TODO handle null event more gracefully
        if (currentForumEvent!.post) {
          setCommentFormOpen(true);
        }

        // setCurrentUserVote(newVotePos);
        await addSticker({ variables: {
          ...coords,
          theta,
          // TODO handle null event more gracefully
          forumEventId: currentForumEvent!._id
        } });
        refetch?.();

        return;
      }
    // When a logged-out user tries to vote, just show the login modal
    } else {
      onSignup()
      // void clearVote()
    }
  }, [currentUser, normalizeCoords, currentForumEvent, addSticker, refetch, onSignup]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const coords = normalizeCoords(event.clientX, event.clientY);
      if (coords) {
        setHoverPos(coords);
      } else {
        setHoverPos(null);
      }
    },
    [normalizeCoords]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      const coords = normalizeCoords(event.clientX, event.clientY);
      if (coords) {
        const theta = (Math.random() * 50) - 25; // Random rotation between -25 and 25 degrees
        setPlacedHearts((prev) => [...prev, { ...coords, theta }]);
      }
    },
    [normalizeCoords]
  );

  return (
    <div
      className={classes.heartsContainer}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={saveStickerPos}
    >
      {hoverPos && (
        <div
          className={classNames(classes.heart, classes.hoverHeart)}
          style={{
            position: "absolute",
            left: `${hoverPos.x * 100}%`,
            top: `${hoverPos.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <ForumIcon icon="Heart" />
        </div>
      )}
      {/* {placedHearts.map((heart, index) => (
        <div
          key={index}
          className={classes.heart}
          style={{
            left: `${heart.x * 100}%`,
            top: `${heart.y * 100}%`,
            transform: `rotate(${heart.theta}deg) translate(-50%, -50%)`,
          }}
        >
          <ForumIcon icon="Heart" />
        </div>
      ))}
      {DEBUG_HEARTS.map((heart, index) => (
        <div
          key={index}
          className={classes.heart}
          style={{
            left: `${heart.x * 100}%`,
            top: `${heart.y * 100}%`,
            transform: `rotate(${heart.theta}deg) translate(-50%, -50%)`,
          }}
        >
          <ForumIcon icon="Heart" />
        </div>
      ))} */}
      {hearts.map((heart, index) => (
        <div
          key={index}
          className={classes.heart}
          style={{
            left: `${heart.x * 100}%`,
            top: `${heart.y * 100}%`,
            transform: `rotate(${heart.theta}deg) translate(-50%, -50%)`,
          }}
        >
          <ForumIcon icon="Heart" />
        </div>
      ))}
      {/* <ForumEventCommentForm
        open={commentFormOpen}
        comment={currentUserComment}
        forumEventId={event._id}
        onClose={() => setCommentFormOpen(false)}
        refetch={refetchComments}
        anchorEl={userVoteRef.current}
        post={event.post}
      /> */}
    </div>
  );
};


const scrollIntoViewHorizontally = (
  container: HTMLElement,
  child: HTMLElement,
) => {
  const child_offsetRight = child.offsetLeft + child.offsetWidth;
  const container_scrollRight = container.scrollLeft + container.offsetWidth;

  if (container.scrollLeft > child.offsetLeft) {
    container.scrollLeft = child.offsetLeft;
  } else if (container_scrollRight < child_offsetRight) {
    container.scrollLeft += child_offsetRight - container_scrollRight;
  }
};

const formatDate = (start: Moment, end: Moment) => {
  const endFormat = start.month() === end.month() ? "D" : "MMM D";
  return `${start.format("MMM D")} - ${end.format(endFormat)}`;
}

const FeedItem = ({
  href,
  user,
  post,
  date,
  classes,
}: {
  href: string,
  icon: ForumIconName,
  iconClassName?: string,
  action: string,
  user: UsersMinimumInfo | null,
  post: PostsMinimumInfo | null,
  date: Date,
  preview: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {onClick} = useClickableCell({href, ignoreLinks: true});
  const {UsersName, PostsTooltip} = Components;
  return (
    <div onClick={onClick} className={classes.feedItem}>
      <div className={classes.feedDetailsWrapper}>
        <div>
          <div className={classes.feedInfo}>
            <InteractionWrapper className={classes.feedInteraction}>
              <PostsTooltip postId={post?._id} placement="bottom-start">
                <Link
                  to={post ? postGetPageUrl(post) : "#"}
                  className={classes.feedPost}
                >
                  {post?.title}
                </Link>
              </PostsTooltip>
            </InteractionWrapper>
          </div>
        </div>
        <div className={classes.feedMeta}>
          <InteractionWrapper className={classes.feedInteraction}>
            <UsersName
              user={user}
              tooltipPlacement="bottom-start"
              className={classes.feedUser}
            />
          </InteractionWrapper>, {moment(date).format("MMM DD")}
        </div>
      </div>
    </div>
  );
}

const SECOND_MATCH_START = 9509;

const GivingSeason2024Banner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    events,
    currentEvent,
    selectedEvent,
    setSelectedEvent,
    amountRaised,
    leaderboard: leaderboardData
  } = useGivingSeasonEvents();
  const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null);
  const [detailsRef, setDetailsRef] = useState<HTMLDivElement | null>(null);
  const [lastTimelineClick, setLastTimelineClick] = useState<number>();
  const didInitialScroll = useRef(false);

  // Note: SECOND_MATCH_START is approximate, we will match based on the amount when we deploy
  const amountRaisedPlusMatched =
    amountRaised + Math.min(amountRaised, 5000) + Math.min(Math.max(amountRaised - SECOND_MATCH_START, 0), 5000);

  /*
  useEffect(() => {
    if (!detailsRef) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = parseInt(entry.target.getAttribute("data-event-id") ?? "");
          if (Number.isSafeInteger(id) && events[id]) {
            setSelectedEvent(events[id]);
          }
        }
      }
    }, {threshold: 0.5});
    for (const child of Array.from(detailsRef.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [timelineRef, detailsRef, events, setSelectedEvent]);
   */

  useEffect(() => {
    if (currentEvent && detailsRef && !didInitialScroll.current) {
      didInitialScroll.current = true;
      setTimeout(() => {
        setLastTimelineClick(Date.now());
        const index = events.findIndex(({name}) => name === currentEvent.name);
        const elem = detailsRef?.querySelector(`[data-event-id="${index}"]`);
        if (detailsRef && elem) {
          scrollIntoViewHorizontally(detailsRef, elem as HTMLElement);
        }
      }, 0);
    }
  }, [events, currentEvent, detailsRef]);

  useEffect(() => {
    // Disable for a short period after clicking an event to prevent spurious
    // scrolling on mobile
    if (lastTimelineClick && Date.now() - lastTimelineClick < 150) {
      return;
    }
    const id = events.findIndex((event) => event === selectedEvent);
    const elem = timelineRef?.querySelector(`[data-event-id="${id}"]`);
    if (elem) {
      scrollIntoViewHorizontally(timelineRef!, elem as HTMLElement);
    }
  }, [timelineRef, selectedEvent, lastTimelineClick, events]);

  useEffect(() => {
    if (!detailsRef) {
      return;
    }
    const handler = (ev: MouseEvent) => {
      ev.preventDefault();
    }
    detailsRef.addEventListener("wheel", handler);
    detailsRef.addEventListener("touchmove", handler);
    return () => {
      detailsRef.removeEventListener("wheel", handler);
      detailsRef.removeEventListener("touchmove", handler);
    }
  }, [detailsRef]);

  const onClickTimeline = useCallback((index: number) => {
    setLastTimelineClick(Date.now());
    detailsRef?.querySelector(`[data-event-id="${index}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setSelectedEvent(events[index] ?? events[0]);
  }, [detailsRef, events, setSelectedEvent]);

  const {EAButton, MixedTypeFeed, DonationElectionLeaderboard} = Components;
  return (
    <div className={classNames(classes.root, selectedEvent.darkText && classes.darkText)}>
      <div className={classes.backgrounds}>
        {events.map(({ name, background }) => (
          <div
            key={name}
            style={{ backgroundImage: `url(${background})` }}
            className={classNames(classes.background, name === selectedEvent.name && classes.backgroundActive)}
          >
            {name === "Donation Celebration" && <Hearts classes={classes} />}
          </div>
        ))}
      </div>
      {/* <div className={classes.backgrounds} style={{ zIndex: 1 }} onMouseMove={(e) => {console.log({e})}}>
        
      </div> */}
      <div className={classes.banner}>
        <Link to="/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement">GIVING SEASON 2024</Link>
      </div>
      <div className={classes.line} />
      <div className={classes.content}>
        <div className={classes.timeline} ref={setTimelineRef}>
          {events.map((event, i) => (
            <div
              key={event.name}
              data-event-id={i}
              data-title={event.name}
              onClick={onClickTimeline.bind(null, i)}
              className={classNames(classes.timelineEvent, selectedEvent === event && classes.timelineEventSelected)}
            >
              {event.name === "Intermission" ? "" : event.name}
              {/* TODO use heart for donation celebration */}
              {event === currentEvent && <div className={classes.timelineDot} />}
            </div>
          ))}
        </div>
        <div className={classes.mainContainer}>
          <div ref={setDetailsRef} className={classNames(
            classes.detailsContainer,
            selectedEvent.hidden && classes.detailsContainerHidden,
          )}>
            {events.map(({
              name,
              description,
              start,
              end,
              discussionTagId,
              discussionTagSlug,
              hidden,
            }, i) => (
              <div
                className={classNames(
                  classes.eventDetails,
                  hidden && classes.eventHidden,
                )}
                data-event-id={i}
                key={name}
              >
                {name === "Donation Election" ? (
                  <div className={classes.electionInfoContainer}>
                    <div className={classes.eventDate}>{formatDate(selectedEvent.start, selectedEvent.end)}</div>
                    <div className={classes.eventName}>{name}</div>
                    <div className={classes.eventDescription}>
                      {description}
                    </div>
                    <div className={classes.electionRaised}>
                      ${formatStat(Math.round(amountRaisedPlusMatched))} raised
                    </div>
                    {leaderboardData && (
                      <DonationElectionLeaderboard
                        voteCounts={leaderboardData}
                        className={classes.hideAboveMd}
                        hideHeader
                      />
                    )}
                    <div className={classes.electionInfoButtonContainer}>
                      <EAButton
                        className={classNames(
                          classes.button,
                          classes.buttonLarge,
                          classes.buttonTranslucentDisabled,
                        )}
                      >
                        You can no longer vote or donate
                      </EAButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={classes.simpleEventContainer}>
                      <div className={classes.eventDate}>{formatDate(start, end)}</div>
                      <div className={classes.eventName}>{name}</div>
                      <div className={classes.eventDescription}>{description}</div>
                    </div>
                    {discussionTagId &&
                      <div className={classes.topPosts}>
                        <div className={classes.topPostsTitle}>Top posts</div>
                        <MixedTypeFeed
                          className={classes.topPostsFeed}
                          firstPageSize={3}
                          hideLoading
                          disableLoadMore
                          resolverName="GivingSeasonTagFeed"
                          resolverArgs={{ tagId: "String!" }}
                          resolverArgsValues={{ tagId: discussionTagId }}
                          sortKeyType="Int"
                          renderers={{
                            newPost: {
                              fragmentName: "PostsList",
                              render: (post: PostsList) => (
                                <FeedItem
                                  href={postGetPageUrl(post)}
                                  icon="DocumentFilled"
                                  action="posted"
                                  user={post.user}
                                  post={post}
                                  date={post.postedAt}
                                  preview={post.contents?.plaintextDescription ?? ""}
                                  classes={classes}
                                />
                              ),
                            },
                            newComment: {
                              fragmentName: "CommentsListWithParentMetadata",
                              render: (comment: CommentsListWithParentMetadata) => (
                                <FeedItem
                                  href={commentGetPageUrl(comment)}
                                  icon="CommentFilled"
                                  action="on"
                                  user={comment.user}
                                  post={comment.post}
                                  date={comment.postedAt}
                                  preview={comment.contents?.plaintextMainText ?? ""}
                                  classes={classes}
                                />
                              ),
                            },
                          }}
                        />
                        {discussionTagSlug &&
                          <div className={classes.topPostsViewMore}>
                            <Link to={tagGetUrl({slug: discussionTagSlug})}>
                              View more
                            </Link>
                          </div>
                        }
                      </div>
                    }
                  </>
                )}
                {name === "Donation Election" && leaderboardData && (
                  <DonationElectionLeaderboard voteCounts={leaderboardData} className={classes.hideBelowMd} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const GivingSeason2024BannerComponent = registerComponent(
  "GivingSeason2024Banner",
  GivingSeason2024Banner,
  {styles},
);

declare global {
  interface ComponentTypes {
    GivingSeason2024Banner: typeof GivingSeason2024BannerComponent
  }
}
