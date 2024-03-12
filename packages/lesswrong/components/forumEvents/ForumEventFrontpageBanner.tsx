import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import moment from "moment";

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
    background: `
      linear-gradient(
        90deg,
        var(--forum-event-background) 0%,
        var(--forum-event-background) 30%,
        ${theme.palette.greyAlpha(0)} 100%
      );
    `,
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
    maxWidth: 480,
  },
  date: {
    fontWeight: 500,
    marginBottom: 6,
    fontSize: '1.1rem',
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
  },
  description: {
    color: theme.palette.text.alwaysWhite,
  },
  image: {
    position: "absolute",
    zIndex: -1,
    top: "-50%",
    right: 0,
    width: "70vw",
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
  if (!currentForumEvent) {
    return null;
  }

  const {title, frontpageDescription, bannerImageId, darkColor} = currentForumEvent;
  const date = formatDate(currentForumEvent);

  // Define background color with a CSS variable to be accessed in the styles
  const style = {
    "--forum-event-background": darkColor,
  } as CSSProperties;

  const {ContentStyles, ContentItemBody, CloudinaryImage2} = Components;
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
