import React, { CSSProperties } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import moment from "moment";
import { HIDE_FORUM_EVENT_BANNER_PREFIX } from "../../lib/cookies/cookies";
import { useDismissable } from "../hooks/useDismissable";
import classNames from "classnames";
import { HEADER_HEIGHT } from "../common/Header";
import { Link } from "@/lib/reactRouterWrapper";

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
    overflow: "hidden",
  },
  rootWithGradient: {
    height: BANNER_HEIGHT,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    ...forumEventBannerGradientBackground(theme),
    [theme.breakpoints.down("sm")]: {
      background: "var(--forum-event-background)",
      height: "unset",
    },
  },
  content: {
    // If you change this width, you probably also want to change the middle
    // breakpoint in `forumEventBannerGradientBackground` to match
    maxWidth: 480,
    padding: 30,
    [theme.breakpoints.down("xs")]: {
      padding: 20,
      marginTop: 8,
    },
  },
  // contentWithPoll: {
  //   maxWidth: 'none',
  //   textAlign: 'center',
  //   paddingTop: 10,
  //   margin: '0 auto',
  // },
  contentWithPollMobile: {
    display: 'none',
    maxWidth: 500,
    textWrap: 'pretty',
    padding: '16px 30px 30px',
    ['@media(max-width: 1040px)']: {
      display: 'block'
    },
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
  titleWithPoll: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 'normal',
  },
  titleWithPollMobile: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 'normal',
  },
  dateWithPoll: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 'normal',
    marginTop: 6,
  },
  descriptionWithPoll: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '140%',
    marginTop: 16,
    "& a": {
      textDecoration: "underline",
    }
  },
  image: {
    position: "absolute",
    zIndex: -1,
    top: -HEADER_HEIGHT,
    width: '100%',
  },
  imageWithGradient: {
    // top: "-45%",
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

/**
 * This is the standard forum event banner. Dismissable.
 *
 * Includes description text on the left side, background dark color fading into
 * banner on the right side.
 *
 * Header is not affected.
 */
const ForumEventFrontpageBannerBasic = ({classes}: {
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
  
  const {ContentStyles, ContentItemBody, CloudinaryImage2, ForumIcon} = Components;

  // Define background color with a CSS variable to be accessed in the styles
  const style = {
    "--forum-event-background": darkColor,
  } as CSSProperties;

  return (
    <div className={classNames(classes.root, classes.rootWithGradient)} style={style}>
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
          className={classNames(classes.image, classes.imageWithGradient)}
        />
      }
      <ForumIcon icon="Close" onClick={dismiss} className={classes.hideButton} />
    </div>
  );
}

/**
 * This is the forum event banner that includes an interactive slider,
 * so we can poll users. Not dismissable.
 *
 * Has no gradient over the banner. On desktop, has a large slider in the center,
 * and the banner is expandable to display event description and post list.
 * On mobile, just displays event description.
 *
 * Header is given a background as well, to match this banner.
 */
const ForumEventFrontpageBannerWithPoll = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentForumEvent();
  if (!currentForumEvent) {
    return null;
  }

  const {title, bannerImageId} = currentForumEvent;
  const date = formatDate(currentForumEvent);
  
  const {CloudinaryImage2, ForumEventPoll} = Components;

  return (
    <div className={classes.root}>
      <ForumEventPoll event={currentForumEvent} />
      <div className={classes.contentWithPollMobile}>
        <div className={classes.titleWithPollMobile}>{title}</div>
        <div className={classes.dateWithPoll}>{date}</div>
        <div className={classes.descriptionWithPoll}>
          Should AI Welfare be an EA priority? Read more about this debate week <Link to="/posts/PeBNdpoRSq59kAfDW/announcing-ai-welfare-debate-week-july-1-7">here</Link>, and vote on desktop.
        </div>
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

export const ForumEventFrontpageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentForumEvent();
  if (!currentForumEvent) {
    return null;
  }

  if (currentForumEvent.includesPoll) {
    return <ForumEventFrontpageBannerWithPoll classes={classes} />
  }
  return <ForumEventFrontpageBannerBasic classes={classes} />
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
