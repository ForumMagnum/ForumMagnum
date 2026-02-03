import React, { CSSProperties, useCallback, useEffect, useRef } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useSingle } from "../../lib/crud/withSingle";
import { hasForumEvents } from "../../lib/betas";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { makeCloudinaryImageUrl } from "../common/CloudinaryImage2";
import ForumEventPoll, { getForumEventVoteForUser } from "./ForumEventPoll";
import { Link } from "@/lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";
import ForumIcon from "../common/ForumIcon";
import classNames from "classnames";
import { useMessages } from "../common/withMessages";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "24px 0px",
    borderRadius: theme.borderRadius.default,
    marginBottom: 40,
    scrollMarginTop: '100px',
  },
  linkIconWrapper: {
    position: "absolute",
    top: 3,
    right: 1,
    cursor: "pointer",
    padding: 8,
    "&:hover $linkIcon": {
      color: theme.palette.primary.main,
    },
  },
  linkIcon: {
    "--icon-size": "15.6px",
    display: "block",
    opacity: 0.8,
    color: theme.palette.icon.dim,
    cursor: "pointer",
  },
  linkIconHighlighted: {
    strokeWidth: "0.7px",
    stroke: "currentColor",
    color: theme.palette.primary.main,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 'normal',
    marginTop: 0,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '20px',
    marginBottom: 20,
    '& a': {
      textDecoration: "underline",
      textUnderlineOffset: '2px',
    }
  },
  pollArea: {
    position: "relative",
    paddingTop: 24,
    borderRadius: theme.borderRadius.default,
    background: "var(--forum-event-background)",
    border: "1px solid color-mix(in srgb, var(--forum-event-banner-text) 30%, var(--forum-event-background))",
    '& .ForumEventPoll-question': {
      fontSize: 24,
    },
    '& .ForumEventPoll-questionFootnote': {
      fontSize: 16,
    }
  },
});

// TODO make this a field on forum events
const announcementPostUrl = '/posts/9ad4C4YknLM5fGG4v/announcing-animal-welfare-vs-global-health-debate-week-oct-7'

/**
 * This is used on the post page to display the current forum event's poll,
 * and allow users to update their vote to show that the post changed their minds.
 * This uses the theme name to set the root element's colors so you should NoSSR it.
 */
export const ForumEventPostPagePollSection = ({postId, forumEventId, classes, ...divProps}: {
  postId?: string,
  forumEventId?: string,
  classes: ClassesType<typeof styles>,
} & React.HTMLAttributes<HTMLDivElement>) => {
  const {params, pathname} = useLocation();
  const navigate = useNavigate();
  const { flash } = useMessages();
  const { captureEvent } = useTracking();

  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  const { document: eventFromId } = useSingle({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    documentId: forumEventId,
    skip: !forumEventId,
  });
  const event = forumEventId ? eventFromId : currentForumEvent;

  const currentUser = useCurrentUser()
  const hasVoted = getForumEventVoteForUser(event, currentUser) !== null
  const pollRef = useRef<HTMLDivElement>(null);
  const { query } = useLocation();

  // Scroll to poll if pollId query param matches this event
  useEffect(() => {
    if (query.pollId && event?._id === query.pollId && pollRef.current) {
      const yOffset = -80;
      const y = pollRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [query.pollId, event?._id]);

  const {document: post} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    documentId: params._id,
    skip: !!forumEventId || !hasForumEvents || !params._id || !event?.tagId || event.eventFormat !== "POLL",
  });

  const isLinkedPoll = query.pollId === event?._id;

  const handleLinkClick = useCallback(async () => {
    if (!event) return;

    captureEvent("pollLinkClicked", { pollId: event._id });

    // Navigate to new URL
    navigate({ pathname, search: `?pollId=${event._id}` });

    // Also copy to clipboard and flash message
    const url = `${window.location.origin}${pathname}?pollId=${event._id}`;
    await navigator.clipboard.writeText(url);
    flash("Link copied to clipboard");
  }, [event, captureEvent, flash, navigate, pathname]);

  // Only show this section for forum events that have a poll
  if ((!event || event.eventFormat !== "POLL") || (event.isGlobal && !post)) {
    return null;
  }

  const {bannerImageId, darkColor, lightColor, bannerTextColor} = event;

  const pollAreaStyle = {
    "--forum-event-background": darkColor,
    "--forum-event-foreground": lightColor,
    "--forum-event-banner-text": bannerTextColor,
  } as CSSProperties;

  if (bannerImageId) {
    const background = `top / cover no-repeat url(${makeCloudinaryImageUrl(bannerImageId, {
      c: "fill",
      dpr: "auto",
      q: "auto",
      f: "auto",
      g: "north",
    })}), ${darkColor}`
    pollAreaStyle.background = background
  }
  return (
    <AnalyticsContext pageSectionContext="forumEventPostPagePollSection">
      <div ref={pollRef} id={`poll-${event._id}`} className={classes.root} {...divProps}>
        {event.isGlobal && (
          <>
            <h2 className={classes.heading}>{!hasVoted ? "Have you voted yet?" : "Did this post change your mind?"}</h2>
            <div className={classes.description}>
              This post is part of <Link to={announcementPostUrl}>{event.title}</Link>.{" "}
              {!hasVoted ? (
                <>
                  Click and drag your avatar to vote on the debate statement. Votes are non-anonymous, and you can
                  change your mind.
                </>
              ) : (
                <>If it changed your mind, click and drag your avatar to move your vote below.</>
              )}
            </div>
          </>
        )}
        <div className={classes.pollArea} style={pollAreaStyle}>
          <div className={classes.linkIconWrapper} onClick={handleLinkClick}>
            <ForumIcon
              icon="Link"
              className={classNames(classes.linkIcon, { [classes.linkIconHighlighted]: isLinkedPoll })}
            />
          </div>
          <ForumEventPoll postId={postId} forumEventId={forumEventId} hideViewResults={event.isGlobal} />
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "ForumEventPostPagePollSection",
  ForumEventPostPagePollSection,
  {styles},
);


