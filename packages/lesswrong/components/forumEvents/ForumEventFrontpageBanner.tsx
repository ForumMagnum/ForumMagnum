import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import moment from "moment";
import { HIDE_FORUM_EVENT_BANNER_PREFIX } from "../../lib/cookies/cookies";
import { useDismissable } from "../hooks/useDismissable";

export const forumEventBannerGradientBackground = (theme: ThemeType) => ({
  background: `
    linear-gradient(
      90deg,
      var(--forum-event-background) 0%,
      var(--forum-event-background) 30%,
      ${theme.palette.greyAlpha(0)} 50%
    );
  `,
});

export const forumEventBannerDescriptionStyles = (theme: ThemeType) => ({
  color: theme.palette.text.alwaysWhite,
  "& a": {
    textDecoration: "underline",
    color: `${theme.palette.text.alwaysWhite} !important`,
    "&::after": {
      display: "inline-block",
      textDecoration: "none",
    },
  },
});

const BANNER_HEIGHT = 180;

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    position: "relative",
    width: "100%",
    height: BANNER_HEIGHT,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 30,
    overflow: "hidden",
    ...forumEventBannerGradientBackground(theme),
    [theme.breakpoints.down("sm")]: {
      background: "var(--forum-event-background)",
      height: "unset",
    },
    [theme.breakpoints.down("xs")]: {
      padding: 20,
      marginTop: 8,
    },
  },
  content: {
    // If you change this width, you probably also want to change the middle
    // breakpoint in `forumEventBannerGradientBackground` to match
    maxWidth: 480,
  },
  date: {
    fontWeight: 500,
    marginBottom: 6,
    fontSize: "1.1rem",
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
  },
  description: {
    ...forumEventBannerDescriptionStyles(theme),
  },
  image: {
    position: "absolute",
    zIndex: -1,
    top: "-45%",
    right: "-10%",
    width: "80vw",
  },
  hideButton: {
    cursor: "pointer",
    position: "absolute",
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    color: theme.palette.text.alwaysWhite,
  },
});

const formatDate = ({startDate, endDate}: ForumEventsDisplay) => {
  const start = moment.utc(startDate);
  const end = moment.utc(endDate);
  const startFormatted = start.format("MMMM D");
  const endFormatted = end.format(
    start.month() === end.month() ? "D" : "MMMM D",
  );
  return `${startFormatted} - ${endFormatted}`;
}

export const ForumEventFrontpageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentForumEvent();
  const cookieName = HIDE_FORUM_EVENT_BANNER_PREFIX + currentForumEvent?._id;
  const {dismiss, dismissed} = useDismissable(cookieName);
  if (!currentForumEvent || dismissed) {
    return null;
  }

  const {title, frontpageDescription, bannerImageId, darkColor} = currentForumEvent;
  const date = formatDate(currentForumEvent);

  // Define background color with a CSS variable to be accessed in the styles
  const style = {
    "--forum-event-background": darkColor,
  } as CSSProperties;

  const {ContentStyles, ContentItemBody, CloudinaryImage2, ForumIcon} = Components;
  return (
    <div className={classes.root} style={style}>
      <div className={classes.content}>
        <div className={classes.date}>{date}</div>
        <div className={classes.title}>{title}</div>
        {frontpageDescription?.html &&
          <ContentStyles contentType="comment">
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: frontpageDescription.html}}
              className={classes.description}
            />
          </ContentStyles>
        }
      </div>
      {bannerImageId &&
        <CloudinaryImage2
          publicId={bannerImageId}
          className={classes.image}
        />
      }
      <ForumIcon icon="Close" onClick={dismiss} className={classes.hideButton} />
    </div>
  );
}

const ForumEventFrontpageBannerComponent = registerComponent(
  "ForumEventFrontpageBanner",
  ForumEventFrontpageBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventFrontpageBanner: typeof ForumEventFrontpageBannerComponent
  }
}
