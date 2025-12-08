import React, { CSSProperties, FC, Fragment, useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrl } from "@/lib/collections/comments/helpers";
import { formatStat } from "@/components/users/EAUserTooltipContent";
import { HEADER_HEIGHT } from "@/components/common/Header";
import { useCurrentTime } from "@/lib/utils/timeUtil";
import { Link } from "@/lib/reactRouterWrapper";
import {
  DONATION_ELECTION_CANDIDATES_HREF,
  DONATION_ELECTION_END,
  DONATION_ELECTION_START,
  DONATION_ELECTION_WINNERS_HREF,
  ELECTION_DONATE_HREF,
  ELECTION_LEARN_MORE_HREF,
  ELECTION_VOTE_HREF,
  GIVING_SEASON_INFO_HREF,
  givingSeasonEvents,
  useGivingSeason,
} from "@/lib/givingSeason";
import classNames from "classnames";
import moment from "moment";
import GivingSeasonFeedItem from "./GivingSeasonFeedItem";
import GivingSeasonTopPosts from "./GivingSeasonTopPosts";
import CloudinaryImage2 from "@/components/common/CloudinaryImage2";
import MixedTypeFeed from "@/components/common/MixedTypeFeed";
import ForumIcon from "@/components/common/ForumIcon";
import DonationElectionLeaderboard from "../DonationElectionLeaderboard";
import { countInstantRunoffVotes } from "@/lib/givingSeason/instantRunoff";

const styles = defineStyles("GivingSeason2025Banner", (theme: ThemeType) => ({
  root: {
    position: "relative",
    marginTop: -HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.text.alwaysBlack,
    width: "100%",
    [theme.breakpoints.up("md")]: {
      borderBottom: `1px solid ${theme.palette.text.alwaysBlack}`,
    },
  },
  backgroundImages: {
    position: "absolute",
    zIndex: 1,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    transition: "opacity linear 0.2s",
    "& img": {
      width: "100%",
      height: "100%",
    },
  },
  backgroundImageHidden: {
    opacity: 0,
  },
  backgroundImageDesktop: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  backgroundImageMobile: {
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  mobileTitle: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    "& a": {
      color: "var(--event-color)",
      padding: "0 24px 12px",
      margin: "0 auto",
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: "-0.03em",
      borderBottom: "1px solid var(--event-color)",
    },
    "& span": {
      opacity: 0.6,
    },
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  main: {
    position: "relative",
    zIndex: 2,
    padding: "20px 80px 40px 80px",
    display: "grid",
    gridTemplateColumns: "500px 1fr",
    gap: "80px",
    justifyContent: "start",
    color: "var(--event-color)",
    transition: "color ease 0.2s",
    [theme.breakpoints.up("xl")]: {
      justifyContent: "center",
    },
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "420px 1fr",
      padding: "20px 16px",
      gap: "24px",
    },
    [theme.breakpoints.down("sm")]: {
      display: "block",
      maxWidth: "calc(min(500px, 100%))",
    },
  },
  events: {
    display: "grid",
    gridTemplateColumns: "min-content 1fr",
    marginBottom: "auto", // Don't expand based on RHS content
    alignItems: "center",
    gap: "12px",
  },
  event: {
    cursor: "pointer",
    display: "contents",
    "& > *": {
      transition: "opacity ease 0.2s",
    },
  },
  eventNotSelected: {
    "& > *": {
      opacity: 0.6,
    },
    "&:hover": {
      "& > *": {
        opacity: 1,
      },
    },
  },
  eventDate: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "100%",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },
  eventTitle: {
    fontSize: 36,
    fontWeight: 600,
    lineHeight: "115%",
    letterSpacing: "-0.04em",
    [theme.breakpoints.down("xs")]: {
      fontSize: 28,
    },
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "140%",
    marginTop: -6,
  },
  readMore: {
    textDecoration: "underline",
    "&:hover": {
      opacity: 1,
      textDecoration: "none",
    },
  },
  feed: {
    minWidth: 0, // Trick to force it to respect the parents grid cells
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  feedPostsList: {
    maxWidth: 560,
  },
  feedButtonRow: {
    marginTop: 6,
    display: "flex",
    gap: "12px",
  },
  feedButton: {
    borderRadius: theme.borderRadius.default,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 500,
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 8,
    transition: "opacity ease 0.2s",
    "& svg": {
      width: 16,
    },
    "&:hover": {
      opacity: 0.8,
    },
    [theme.breakpoints.down("sm")]: {
      padding: "8px 12px",
    },
    [theme.breakpoints.down("xs")]: {
      padding: 8,
    },
  },
  feedButtonPrimary: {
    background: "var(--event-color)",
    color: theme.palette.text.alwaysBlack,
  },
  feedButtonSecondary: {
    background: theme.palette.text.alwaysBlack,
    color: "var(--event-color)",
    border: "1px solid var(--event-color)",
  },
  mobileLeaderboard: {
    marginTop: 16,
    display: "none",
    [theme.breakpoints.down("sm")]: {
      display: "block",
      padding: 0,
      color: "var(--event-color)",
    },
  },
  eventHiddenOnMobile: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  mobileButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: 16,
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  electionExpanded: {
    padding: "24px 50px !important",
    "& .GivingSeason2025Banner-electionStatus": {
      gap: "6px !important"
    },
    [theme.breakpoints.down("md")]: {
      padding: "16px !important",
    },
  },
  election: {
    backgroundColor: "var(--event-color)",
    transition: "background-color ease 0.2s",
    color: theme.palette.text.alwaysBlack,
    position: "relative",
    zIndex: 2,
    padding: "12px 50px",
    display: "flex",
    justifyContent: "space-between",
    [theme.breakpoints.down("md")]: {
      padding: 16,
    },
    [theme.breakpoints.down("sm")]: {
      margin: 16,
      borderRadius: theme.borderRadius.default,
      border: `1px solid ${theme.palette.text.alwaysBlack}`,
      transform: "translateY(-16px)",
    },
  },
  electionStatus: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    width: "100%",
    maxWidth: "100%",
  },
  amountRaised: {
    fontWeight: 700,
    lineHeight: "140%",
    letterSpacing: "-0.03em",
    "& span": {
      opacity: 0.5,
    },
  },
  amountRaisedDesktop: {
    fontSize: 19,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  amountRaisedMobile: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 16,
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  progress: {
    position: "relative",
    maxWidth: "100%",
    width: 480,
    height: 12,
    borderRadius: 100,
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  progressBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: theme.palette.text.alwaysBlack,
    opacity: 0.1,
    zIndex: 1,
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: theme.palette.text.alwaysBlack,
    zIndex: 2,
  },
  match: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    opacity: 0.4,
  },
  electionButtons: {
    position: "absolute",
    top: 0,
    right: 50,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    height: "100%",
    "& *": {
      cursor: "pointer",
      height: 38,
      padding: "12px 24px",
      outline: "none",
      borderRadius: theme.borderRadius.default,
      fontSize: 14,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      border: `1px solid ${theme.palette.text.alwaysBlack}`,
      transition: "background-color ease 0.2, color ease 0.2s",
      "&:hover": {
        opacity: 1,
      },
    },
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  buttonOutlined: {
    backgroundColor: "transparent",
    color: theme.palette.text.alwaysBlack,
    "&:hover": {
      backgroundColor: theme.palette.text.alwaysBlack,
      color: theme.palette.text.alwaysWhite,
    },
  },
  buttonOutlinedDisabled: {
    backgroundColor: "transparent",
    color: theme.palette.text.alwaysBlack,
    cursor: "not-allowed",
    opacity: 0.5,
    "&:hover": {
      opacity: 0.5,
    },
  },
  buttonBlack: {
    backgroundColor: theme.palette.text.alwaysBlack,
    color: theme.palette.text.alwaysWhite,
    "&:hover": {
      backgroundColor: "transparent",
      color: theme.palette.text.alwaysBlack,
    },
  },
}))

export const GivingSeason2025Banner: FC = () => {
  const now = useCurrentTime();
  const {captureEvent} = useTracking();
  const {
    currentEvent,
    selectedEvent,
    setSelectedEvent,
    amountRaised,
    amountTarget,
    leaderboard,
  } = useGivingSeason();

  const onLinkClick = useCallback((eventName: string, href: string) => {
    captureEvent(eventName, {href});
  }, [captureEvent]);

  const classes = useStyles(styles);
  if (!currentEvent) {
    return null;
  }

  const isLeaderboardDisplayed =
    selectedEvent.name === "Donation election" &&
    leaderboard && countInstantRunoffVotes(leaderboard) >= 100;

  const isVotingEnded = now > DONATION_ELECTION_END;
  const isVotingOpen = DONATION_ELECTION_START < now && !isVotingEnded;

  const isMobileLeaderboardAllowed = currentEvent.name === "Donation election";
  const isMobileLeaderboardDisplayed = isMobileLeaderboardAllowed && isLeaderboardDisplayed;

  return (
    <AnalyticsContext pageSectionContext="GivingSeason2025Banner">
      <div
        style={{"--event-color": selectedEvent.color} as CSSProperties}
        className={classes.root}
      >
        <div className={classes.backgroundImages}>
          {givingSeasonEvents.map((event, i) => (
            <Fragment key={event.name}>
              <CloudinaryImage2
                publicId={event.desktopCloudinaryId}
                wrapperClassName={classNames(
                  classes.backgroundImage,
                  classes.backgroundImageDesktop,
                  event !== selectedEvent && classes.backgroundImageHidden,
                )}
                style={{zIndex: i}}
                objectFit="cover"
              />
              <CloudinaryImage2
                publicId={event.mobileCloudinaryId}
                wrapperClassName={classNames(
                  classes.backgroundImage,
                  classes.backgroundImageMobile,
                  event !== selectedEvent && classes.backgroundImageHidden,
                )}
                style={{zIndex: i}}
                objectFit="cover"
              />
            </Fragment>
          ))}
        </div>
        <div className={classes.mobileTitle}>
          <Link to={GIVING_SEASON_INFO_HREF}>
            Giving season <span>2025</span>
          </Link>
        </div>
        <div className={classes.main}>
          <div className={classes.events}>
            {givingSeasonEvents.map((event) => {
              const shouldHideOnMobile = isMobileLeaderboardAllowed && event.end > currentEvent.end;

              return (
              <div
                key={event.name}
                role="button"
                onClick={setSelectedEvent.bind(null, event)}
                className={classNames(
                  classes.event,
                  event !== selectedEvent && classes.eventNotSelected,
                  shouldHideOnMobile && classes.eventHiddenOnMobile,
                )}
              >
                <div className={classes.eventDate}>
                  {moment(event.start).format("MMM D")}
                </div>
                <div className={classes.eventTitle}>
                  {event.name}
                </div>
                {event === selectedEvent && (
                  <>
                    <div />
                    <div className={classes.eventDescription}>
                      {event.description}{" "}
                      <Link to={event.readMoreHref} className={classes.readMore}>
                        Read more.
                      </Link>
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
          {isMobileLeaderboardDisplayed && (
            <div className={classes.mobileLeaderboard}>
              <DonationElectionLeaderboard
                voteCounts={leaderboard}
                hideHeader
              />
            </div>
          )}
          {currentEvent.name === "Donation election" && (
            <div className={classes.mobileButtonRow}>
              {!isVotingOpen && <Link
                to={ELECTION_LEARN_MORE_HREF}
                onClick={onLinkClick.bind(null, "learnMore", ELECTION_LEARN_MORE_HREF)}
                className={classNames(classes.feedButton, classes.feedButtonSecondary)}
              >
                Learn more
              </Link>}
              {!isVotingEnded && <a
                href={ELECTION_DONATE_HREF}
                onClick={onLinkClick.bind(null, "donate", ELECTION_DONATE_HREF)}
                className={classNames(classes.feedButton, classes.feedButtonPrimary)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate
              </a>}
              {isVotingOpen && <Link
                to={ELECTION_VOTE_HREF}
                onClick={onLinkClick.bind(null, "vote", ELECTION_VOTE_HREF)}
                className={classNames(classes.feedButton, classes.feedButtonSecondary)}
              >
                Vote in the election
              </Link>}
            </div>
          )}
          <div className={classes.feed}>
            <div className={classes.feedPostsList}>
              {!isLeaderboardDisplayed && currentEvent?.tag && selectedEvent === currentEvent && (
                <>
                <MixedTypeFeed
                    firstPageSize={selectedEvent?.feedCount}
                    hideLoading
                    disableLoadMore
                    resolverName="GivingSeasonTagFeed"
                    resolverArgs={{tagId: "String!"}}
                    resolverArgsValues={{tagId: currentEvent.tag._id}}
                    sortKeyType="Date"
                    renderers={{
                      newPost: {
                        fragmentName: "PostsList",
                        render: (post: PostsList) => (
                          <GivingSeasonFeedItem
                            href={postGetPageUrl(post)}
                            iconStyle="post"
                            action="posted"
                            user={post.user}
                            post={post}
                            date={post.postedAt}
                            preview={post.contents?.plaintextDescription ?? ""}
                          />
                        ),
                      },
                      newComment: {
                        fragmentName: "CommentsListWithParentMetadata",
                        render: (comment: CommentsListWithParentMetadata) => (
                          <GivingSeasonFeedItem
                            href={commentGetPageUrl(comment)}
                            iconStyle="comment"
                            action="on"
                            user={comment.user}
                            post={comment.post}
                            date={comment.postedAt}
                            preview={comment.contents?.plaintextMainText ?? ""}
                          />
                        ),
                      },
                    }}
                  />
                  {currentEvent?.name === "Marginal funding week" &&
                      currentEvent.name === selectedEvent.name &&
                      selectedEvent.tag &&
                    <Link
                      to={currentEvent.readMoreHref}
                      className={classNames(classes.feedButton, classes.feedButtonPrimary)}
                    >
                      Explore all posts
                      <ForumIcon icon="ArrowRight" />
                    </Link>
                  }
                </>
              )}
              {!isLeaderboardDisplayed && selectedEvent.tag &&
                  selectedEvent.end < now &&
                  selectedEvent !== currentEvent && (
                <GivingSeasonTopPosts
                  tagId={selectedEvent.tag._id}
                  tagSlug={selectedEvent.tag.slug}
                />
              )}
            </div>
            {isLeaderboardDisplayed && <DonationElectionLeaderboard voteCounts={leaderboard} />}
            {selectedEvent?.name === "Donation election" && (
              <div className={classes.feedButtonRow}>
                {isVotingOpen && <Link
                  to={ELECTION_VOTE_HREF}
                  onClick={onLinkClick.bind(null, "vote", ELECTION_VOTE_HREF)}
                  className={classNames(classes.feedButton, classes.feedButtonPrimary)}
                >
                  Vote in the election
                  <ForumIcon icon="ArrowRight" />
                </Link>}
                {DONATION_ELECTION_CANDIDATES_HREF && !DONATION_ELECTION_WINNERS_HREF && <Link
                  to={DONATION_ELECTION_CANDIDATES_HREF}
                  onClick={onLinkClick.bind(null, "meetTheCandidates", DONATION_ELECTION_CANDIDATES_HREF)}
                  className={classNames(classes.feedButton, classes.feedButtonSecondary)}
                >
                  Read about the candidates
                </Link>}
                {DONATION_ELECTION_WINNERS_HREF && <Link
                  to={DONATION_ELECTION_WINNERS_HREF}
                  onClick={onLinkClick.bind(null, "meetTheWinners", DONATION_ELECTION_WINNERS_HREF)}
                  className={classNames(classes.feedButton, classes.feedButtonPrimary)}
                >
                  Read about the winners
                </Link>}
              </div>
            )}
          </div>
        </div>
        <div className={classNames(classes.election, currentEvent.name === "Donation election" && classes.electionExpanded)}>
          <div className={classes.electionStatus}>
            <div className={classNames(
              classes.amountRaised,
              classes.amountRaisedDesktop,
            )}>
              ${formatStat(amountRaised)} raised{" "}
              <span>to the Donation Election Fund</span>
            </div>
            <div className={classNames(
              classes.amountRaised,
              classes.amountRaisedMobile,
            )}>
              <span>Donation Election Fund</span>
              <div>${formatStat(amountRaised)}</div>
            </div>
            <div className={classes.progress} aria-hidden>
              <div className={classes.progressBackground} />
              <div
                style={{width: `${amountRaised / amountTarget * 100}%`}}
                className={classes.progressBar}
              />
            </div>
            <div className={classes.match}>
              Includes our match on the first $5000
            </div>
          </div>
          <div className={classes.electionButtons}>
            {!isVotingOpen && <Link
              to={ELECTION_LEARN_MORE_HREF}
              onClick={onLinkClick.bind(null, "learnMore", ELECTION_LEARN_MORE_HREF)}
              className={classes.buttonOutlined}
            >
              Learn more
            </Link>}
            {!isVotingEnded && <a
              href={ELECTION_DONATE_HREF}
              onClick={onLinkClick.bind(null, "donate", ELECTION_DONATE_HREF)}
              className={classes.buttonBlack}
              target="_blank"
              rel="noopener noreferrer"
            >
              Donate
            </a>}
            {isVotingOpen && <Link
              to={ELECTION_VOTE_HREF}
              onClick={onLinkClick.bind(null, "vote", ELECTION_VOTE_HREF)}
              className={classes.buttonOutlined}
            >
              Vote in the election
            </Link>}
            {isVotingEnded && <div
              className={classes.buttonOutlinedDisabled}
            >
              You can no longer vote or donate
            </div>}
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent("GivingSeason2025Banner", GivingSeason2025Banner);
