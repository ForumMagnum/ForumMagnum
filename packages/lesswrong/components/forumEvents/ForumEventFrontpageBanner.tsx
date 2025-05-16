import React, { FC } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentAndRecentForumEvents } from "../hooks/useCurrentForumEvent";
import moment from "moment";
import { HIDE_FORUM_EVENT_BANNER_PREFIX } from "../../lib/cookies/cookies";
import { useDismissable } from "../hooks/useDismissable";
import classNames from "classnames";
import { HEADER_HEIGHT } from "../common/Header";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import ContentStyles from "../common/ContentStyles";
import ContentItemBody from "../common/ContentItemBody";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import ForumIcon from "../common/ForumIcon";
import ForumEventPoll from "./ForumEventPoll";
import ForumEventStickers from "./ForumEventStickers";

const POLL_MIN_WIDTH = 800;

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

export const forumEventBannerDescriptionStyles = () => ({
  color: "var(--forum-event-banner-text)",
  textWrap: "pretty",
  "& a": {
    textDecoration: "underline",
    textUnderlineOffset: '2px',
    color: "var(--forum-event-banner-text) !important",
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
    color: "var(--forum-event-banner-text)",
    position: "relative",
    width: "100%",
    overflow: "hidden",
    "& a": {
      textDecoration: "underline",
      textUnderlineOffset: '2px',
    },
  },
  hideBelowMinWidth: {
    [`@media(max-width: ${POLL_MIN_WIDTH}px)`]: {
      display: 'none'
    },
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
  expandToggleButton: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 3,
    background: 'none',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    color: "var(--forum-event-banner-text)",
    padding: 0,
    '&:hover': {
      opacity: 0.7
    }
  },
  expandToggleIcon: {
    fontSize: 16,
  },
  contentBasic: {
    // If you change this width, you probably also want to change the middle
    // breakpoint in `forumEventBannerGradientBackground` to match
    maxWidth: 480,
    padding: 30,
    position: "relative",
    [theme.breakpoints.down("xs")]: {
      padding: 20,
      marginTop: 8,
    },
  },
  contentWithStickers: {
    // Pass pointer events through on mobile, not on desktop
    pointerEvents: "none",
    "& .ContentStyles-commentBody *": {
      pointerEvents: "none !important",
    },
    [theme.breakpoints.up("sm")]: {
      "& > *": {
        pointerEvents: "auto !important",
      },
      "& .ContentStyles-commentBody *": {
        pointerEvents: "auto !important",
      },
    },

    maxWidth: 400,
    margin: "24px 0 28px 36px",
    [theme.breakpoints.down("sm")]: {
      margin: "24px 0 28px 22px",
    },
    [theme.breakpoints.down("xs")]: {
      margin: "28px 0 40px 0",
    },
  },
  contentWithPoll: {
    display: 'none',
    maxWidth: 500,
    textWrap: 'pretty',
    padding: '16px 30px 30px',
  },
  postsHeading: {
    display: 'flex',
    columnGap: '8px',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
  },
  postsHeadingIcon: {
    fontSize: 16,
    cursor: 'pointer',
    opacity: 0.5,
    '&:hover': {
      opacity: 0.7
    }
  },
  posts: {
    flex: '1 1 0',
    minWidth: 0,
    maxWidth: 600,
  },
  postsAndBody: {
    display: 'flex',
    columnGap: '48px',
  },
  postsSeeAll: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '140%',
    marginTop: 16,
    "& a": {
      textDecoration: "underline",
      textUnderlineOffset: '2px',
    }
  },
  date: {
    fontWeight: 500,
    marginBottom: 6,
    fontSize: "1.1rem",
    width: "fit-content"
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
  },
  titleWithStickers: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 'normal',
    [theme.breakpoints.down("xs")]: {
      fontSize: 28,
    }
  },
  titleWithPoll: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 'normal',
  },
  description: {
    ...forumEventBannerDescriptionStyles(),
    width: "fit-content"
  },
  descriptionContentStyles: {
    width: "fit-content"
  },
  dateWithPoll: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 'normal',
    marginTop: 6,
  },
  descriptionWithPoll: {
    marginTop: 20
  },
  image: {
    position: "absolute",
    zIndex: -1,
    top: -HEADER_HEIGHT,
    right: 0,
    width: '100%',
    height: `calc(100% + ${HEADER_HEIGHT}px)`,
    objectFit: "cover",
  },
  imageWithGradient: {
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
    color: "var(--forum-event-banner-text)",
  },
  hideAboveXs: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  hideBelowXs: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  }
});

const formatDate = ({ startDate, endDate }: { startDate: Date, endDate: Date }) => {
  const start = moment.utc(startDate);
  const end = moment.utc(endDate);
  const startFormatted = start.format("MMMM D");
  const endFormatted = end.format(
    start.month() === end.month() ? "D" : "MMMM D",
  );
  return `${startFormatted} - ${endFormatted}`;
}

const Description = ({forumEvent, classes}: {
  forumEvent: ForumEventsDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const { frontpageDescription, frontpageDescriptionMobile } = forumEvent;

  return (
    <>
      {frontpageDescription?.html && (
        <ContentStyles contentType="comment" className={classNames(classes.descriptionContentStyles, classes.hideBelowXs)}>
          <ContentItemBody
            dangerouslySetInnerHTML={{ __html: frontpageDescription.html }}
            className={classes.description}
          />
        </ContentStyles>
      )}
      {frontpageDescriptionMobile?.html && (
        <ContentStyles contentType="comment" className={classNames(classes.descriptionContentStyles, classes.hideAboveXs)}>
          <ContentItemBody
            dangerouslySetInnerHTML={{ __html: frontpageDescriptionMobile.html }}
            className={classes.description}
          />
        </ContentStyles>
      )}
    </>
  );
}

/**
 * This is the standard forum event banner. Dismissable.
 *
 * Includes description text on the left side, background dark color fading into
 * banner on the right side.
 *
 * Site header is not affected.
 */
const ForumEventFrontpageBannerBasic = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  const cookieName = HIDE_FORUM_EVENT_BANNER_PREFIX + currentForumEvent?._id;
  const {dismiss, dismissed} = useDismissable(cookieName);
  if (!currentForumEvent || dismissed) {
    return null;
  }

  const {title, bannerImageId, startDate, endDate} = currentForumEvent;
  const date = endDate ? formatDate({ startDate, endDate }) : null;
  return (
    <AnalyticsContext pageSectionContext="forumEventFrontpageBannerBasic">
      <div className={classNames(classes.root, classes.rootWithGradient)}>
        <div className={classes.contentBasic}>
          {date && <div className={classes.date}>{date}</div>}
          <div className={classes.title}>{title}</div>
          <Description forumEvent={currentForumEvent} classes={classes} />
        </div>
        {bannerImageId &&
          <CloudinaryImage2
            publicId={bannerImageId}
            className={classNames(classes.image, classes.imageWithGradient)}
          />
        }
        <ForumIcon icon="Close" onClick={dismiss} className={classes.hideButton} />
      </div>
    </AnalyticsContext>
  );
}

/**
 * This is the forum event banner that includes an interactive slider on desktop,
 * so we can poll users. Not dismissable.
 *
 * Has no gradient over the banner. On desktop, has a large slider in the center,
 * and the banner is expandable to display event description and post list.
 *
 * On mobile, just displays event description.
 *
 * On the home page, the site header is given a background as well,
 * to match this banner.
 */
const ForumEventFrontpageBannerWithPoll = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  
  if (!currentForumEvent) {
    return null;
  }

  const {title, bannerImageId, frontpageDescription, frontpageDescriptionMobile, startDate, endDate} = currentForumEvent;
  const date = endDate && formatDate({startDate, endDate});
  const mobileDescription = frontpageDescriptionMobile?.html ?? frontpageDescription?.html
  return (
    <AnalyticsContext pageSectionContext="forumEventFrontpageBannerWithPoll">
      <div className={classes.root}>
        <ForumEventPoll className={classes.hideBelowMinWidth} />
        <div className={classNames(classes.contentWithPoll, classes.hideBelowMinWidth)}>
          <div className={classes.titleWithPoll}>{title}</div>
          {date && <div className={classes.dateWithPoll}>{date}</div>}
          <div className={classes.descriptionWithPoll}>
              {mobileDescription &&
                <ContentStyles contentType="comment">
                  <ContentItemBody
                    dangerouslySetInnerHTML={{__html: mobileDescription}}
                    className={classes.description}
                  />
                </ContentStyles>
              }
            </div>
        </div>
        {bannerImageId &&
          <CloudinaryImage2
            publicId={bannerImageId}
            className={classes.image}
          />
        }
      </div>
    </AnalyticsContext>
  );
}

/**
 * Forum event banner that allows users to place "stickers". These are icons that
 * persist and are visible to all users once placed. They can also have a comment
 * attached, which will appear on the post set on the event with `postId`.
 */
const ForumEventFrontpageBannerWithStickers = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  
  if (!currentForumEvent) {
    return null;
  }

  const {title, bannerImageId} = currentForumEvent;
  return (
    <AnalyticsContext pageSectionContext="forumEventFrontpageBannerWithStickers">
      <div className={classes.root}>
        <ForumEventStickers />
        <div className={classNames(classes.contentBasic, classes.contentWithStickers)}>
          <div className={classes.titleWithStickers}>{title}</div>
          <Description forumEvent={currentForumEvent} classes={classes} />
        </div>
        {bannerImageId && <CloudinaryImage2 publicId={bannerImageId} className={classes.image} />}
      </div>
    </AnalyticsContext>
  );
}

const customComponents: Partial<Record<Exclude<DbForumEvent['customComponent'], null>, FC>> = {
  // This component was presumably deleted, it not being 2024 anymore.
  // GivingSeason2024Banner,
};

export const ForumEventFrontpageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  if (!currentForumEvent) {
    return null;
  }

  const {customComponent, eventFormat} = currentForumEvent;
  if (customComponent) {
    const CustomComponent = customComponents[customComponent];
    if (CustomComponent) {
      return (
        <AnalyticsContext
          pageSectionContext="forumEventFrontpageBannerCustom"
          componentName={customComponent}
        >
          <CustomComponent />
        </AnalyticsContext>
      );
    }
  }

  switch (eventFormat) {
    case "POLL":
      return <ForumEventFrontpageBannerWithPoll classes={classes} />;
    case "STICKERS":
      return <ForumEventFrontpageBannerWithStickers classes={classes} />;
    default:
      return <ForumEventFrontpageBannerBasic classes={classes} />;
  }
}

export default registerComponent(
  "ForumEventFrontpageBanner",
  ForumEventFrontpageBanner,
  {styles},
);


