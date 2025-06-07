import React, { CSSProperties } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import { useLocation } from "../../lib/routeUtil";
import { hasForumEvents } from "../../lib/betas";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeCloudinaryImageUrl } from "../common/CloudinaryImage2";
import ForumEventPoll, { getForumEventVoteForUser } from "./ForumEventPoll";
import { Link } from "@/lib/reactRouterWrapper";
import { useConcreteThemeOptions } from "../themes/useTheme";
import { useCurrentUser } from "../common/withUser";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import classNames from "classnames";

const ForumEventsDisplayQuery = gql(`
  query ForumEventPostPagePollSection2($documentId: String) {
    forumEvent(input: { selector: { documentId: $documentId } }) {
      result {
        ...ForumEventsDisplay
      }
    }
  }
`);

const PostsDetailsQuery = gql(`
  query ForumEventPostPagePollSection($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsDetails
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 24,
    borderRadius: theme.borderRadius.default,
    marginBottom: 40,
    scrollMarginTop: '100px',
  },
  rootEmbedded: {
    padding: 6
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
    paddingTop: 24,
    borderRadius: theme.borderRadius.default,
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
  const {params} = useLocation();

  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  const { data: eventFromId } = useQuery(ForumEventsDisplayQuery, {
    variables: { documentId: forumEventId },
    skip: !forumEventId,
  });
  const event = forumEventId ? eventFromId?.forumEvent?.result : currentForumEvent;

  const currentUser = useCurrentUser()
  const hasVoted = getForumEventVoteForUser(event, currentUser) !== null
  const themeOptions = useConcreteThemeOptions()

  const { data } = useQuery(PostsDetailsQuery, {
    variables: { documentId: params._id },
    skip: !!forumEventId || !hasForumEvents || !params._id || !event?.tagId || event.eventFormat !== "POLL",
  });
  const post = data?.post?.result;

  // Only show this section for forum events that have a poll
  if ((!event || event.eventFormat !== "POLL") || (event.isGlobal && !post)) {
    return null;
  }

  const {bannerImageId, darkColor, lightColor, bannerTextColor} = event;

  const pollAreaStyle = {
    "--forum-event-background": darkColor,
    "--forum-event-foreground": lightColor,
    "--forum-event-banner-text": bannerTextColor,
    background: "var(--forum-event-background)",
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
      <div
        className={classNames(classes.root, { [classes.rootEmbedded]: !event.isGlobal })}
        style={
          themeOptions.name === "dark"
            ? { background: darkColor, color: lightColor }
            : { background: lightColor, color: darkColor }
        }
        {...divProps}
      >
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


