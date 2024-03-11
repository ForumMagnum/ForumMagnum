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
        rgba(255,255,255,0) 100%
      );
    `,
    [theme.breakpoints.down("sm")]: {
      background: "var(--forum-event-background)",
    },
  },
  content: {
    maxWidth: 480,
  },
  date: {
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
  },
  description: {
    color: theme.palette.text.alwaysWhite,
  },
  imageWrapper: {
    zIndex: -1,
  },
  image: {
    position: "absolute",
    top: "-50%",
    right: 0,
    width: "100vw",
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
          wrapperClassName={classes.imageWrapper}
          objectFit="contain"
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
