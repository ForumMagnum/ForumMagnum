import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import { useLocation } from "../../lib/routeUtil";
import { useSingle } from "../../lib/crud/withSingle";
import { hasForumEvents } from "../../lib/betas";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeCloudinaryImageUrl } from "../common/CloudinaryImage2";
import { POLL_MAX_WIDTH, getForumEventVoteForUser } from "./ForumEventPoll";
import { Link } from "@/lib/reactRouterWrapper";
import { useConcreteThemeOptions } from "../themes/useTheme";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 24,
    borderRadius: theme.borderRadius.default,
    marginBottom: 40,
    [`@media (max-width: ${POLL_MAX_WIDTH}px)`]: {
      display: 'none'
    }
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
    paddingTop: 20,
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
export const ForumEventPostPagePollSection = ({postId, classes}: {
  postId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {params} = useLocation();
  const {currentForumEvent} = useCurrentForumEvent();
  const currentUser = useCurrentUser()
  const hasVoted = getForumEventVoteForUser(currentForumEvent, currentUser) !== null
  const themeOptions = useConcreteThemeOptions()

  const {document: post} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    documentId: params._id,
    skip: !hasForumEvents || !params._id || !currentForumEvent?.tagId || currentForumEvent.eventFormat !== "POLL",
  });

  // Only show this section for forum events that have a poll
  if (!currentForumEvent || !post || currentForumEvent.eventFormat !== "POLL") {
    return null;
  }

  // Only show this section for posts tagged with the event tag
  const relevance = currentForumEvent.tagId ? (post?.tagRelevance?.[currentForumEvent.tagId] ?? 0) : 0;
  if (relevance < 1) {
    return null;
  }

  const {bannerImageId, darkColor, lightColor} = currentForumEvent;
  const pollAreaStyle: CSSProperties = {background: darkColor}
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

  const {ForumEventPoll} = Components;

  return (
    <AnalyticsContext pageSectionContext="forumEventPostPagePollSection">
      <div className={classes.root} style={
        themeOptions.name === 'dark' ? {background: darkColor, color: lightColor} : {background: lightColor, color: darkColor}
      }>
        <h2 className={classes.heading}>
          {!hasVoted ? 'Have you voted yet?' : 'Did this post change your mind?'}
        </h2>
        <div className={classes.description}>
          This post is part of <Link to={announcementPostUrl}>{currentForumEvent.title}</Link>.{" "}
          {!hasVoted ? <>
            Click and drag your avatar to vote on the debate statement. Votes are non-anonymous, and you can change your mind.
          </> : <>
            If it changed your mind, click and drag your avatar to move your vote below.
          </>}
        </div>
        <div className={classes.pollArea} style={pollAreaStyle}>
          <ForumEventPoll postId={postId} hideViewResults />
        </div>
      </div>
    </AnalyticsContext>
  );
}

const ForumEventPostPagePollSectionComponent = registerComponent(
  "ForumEventPostPagePollSection",
  ForumEventPostPagePollSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventPostPagePollSection: typeof ForumEventPostPagePollSectionComponent
  }
}
