import React, { CSSProperties, useMemo, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import moment from "moment";
import { HIDE_FORUM_EVENT_BANNER_PREFIX } from "../../lib/cookies/cookies";
import { useDismissable } from "../hooks/useDismissable";
import classNames from "classnames";
import { HEADER_HEIGHT } from "../common/Header";
import { Link } from "@/lib/reactRouterWrapper";
import orderBy from "lodash/orderBy";
import toPairs from "lodash/toPairs";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { POLL_MAX_WIDTH } from "./ForumEventPoll";

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
    textUnderlineOffset: '2px',
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
  expandToggleRow: {
    padding: '0 20px 20px',
    [`@media(max-width: ${POLL_MAX_WIDTH}px)`]: {
      display: 'none'
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
    color: theme.palette.text.alwaysWhite,
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
    [theme.breakpoints.down("xs")]: {
      padding: 20,
      marginTop: 8,
    },
  },
  contentWithPoll: {
    maxWidth: 1000,
    padding: '0 30px 58px',
    margin: '0 auto ',
    [`@media(max-width: ${POLL_MAX_WIDTH}px)`]: {
      display: 'none'
    },
  },
  contentWithPollMobile: {
    display: 'none',
    maxWidth: 500,
    textWrap: 'pretty',
    padding: '16px 30px 30px',
    [`@media(max-width: ${POLL_MAX_WIDTH}px)`]: {
      display: 'block'
    },
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
  contentWithPollBody: {
    flex: 'none',
    width: 250,
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
    marginTop: 20,
    "& a": {
      textDecoration: "underline",
      textUnderlineOffset: '2px',
    }
  },
  image: {
    position: "absolute",
    zIndex: -1,
    top: -HEADER_HEIGHT,
    right: 0,
    width: '100%',
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
 * Site header is not affected.
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
    <AnalyticsContext pageSectionContext="forumEventFrontpageBannerBasic">
      <div className={classNames(classes.root, classes.rootWithGradient)} style={style}>
        <div className={classes.contentBasic}>
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
  const {currentForumEvent} = useCurrentForumEvent();
  const [expanded, setExpanded] = useState(false)
  
  // Calculate how many points each post got, to find the 4 most influential posts
  const influentialPosts = useMemo(() => {
    if (!currentForumEvent?.publicData) return []

    // Track the total number of points each post got, {postId: points}
    const scores: Record<string, number> = {}
    Object.values(currentForumEvent?.publicData).forEach((vote: AnyBecauseTodo) => {
      if (vote.points) {
        Object.keys(vote.points).forEach((postId: string) => {
          if (postId in scores) {
            scores[postId] += vote.points[postId]
          } else {
            scores[postId] = vote.points[postId]
          }
        })
      }
    })
    const postIdScorePairs = toPairs(scores)
    return orderBy(postIdScorePairs, p => p[1], 'desc').map(p => p[0]).slice(0, 4)
  }, [currentForumEvent])
  
  if (!currentForumEvent) {
    return null;
  }

  const {title, bannerImageId, tag, frontpageDescription, frontpageDescriptionMobile} = currentForumEvent;
  const date = formatDate(currentForumEvent);
  const mobileDescription = frontpageDescriptionMobile?.html ?? frontpageDescription?.html
  
  const {
    CloudinaryImage2, ForumEventPoll, ForumIcon, LWTooltip, PostsList2, ContentStyles, ContentItemBody
  } = Components;
  
  return (
    <AnalyticsContext pageSectionContext="forumEventFrontpageBannerWithPoll">
      <div className={classes.root}>
        <ForumEventPoll />
        <div className={classes.expandToggleRow}>
          <button className={classes.expandToggleButton} onClick={() => setExpanded(!expanded)}>
            <ForumIcon
              icon={expanded ? "ThickChevronDown" : "ThickChevronRight"}
              className={classes.expandToggleIcon}
            />
            {expanded ? 'Collapse' : `Most influential posts`}
          </button>
        </div>
        {expanded && <div className={classes.contentWithPoll}>
          <div className={classes.postsHeading}>
            Most influential posts so far
            <LWTooltip
              title="
                The most influential posts are those that are responsible for the
                most opinion change, based on the posts cited when you change your
                mind on the banner.
              "
            >
              <ForumIcon icon="QuestionMarkCircleFilled" className={classes.postsHeadingIcon} />
            </LWTooltip>
          </div>
          <div className={classes.postsAndBody}>
            <div className={classes.posts}>
              <PostsList2
                terms={{postIds: influentialPosts, limit: 4}}
                order={influentialPosts}
                showLoadMore={false}
                placeholderCount={4}
                showKarma={false}
                hideTag
                showNoResults={false}
                showPlacement
              />
              {tag && <div className={classes.postsSeeAll}>
                See all eligible posts <Link to={tagGetUrl(tag)}>here</Link>
              </div>}
            </div>
            <div className={classes.contentWithPollBody}>
              <div className={classes.titleWithPoll}>{title}</div>
              <div className={classes.dateWithPoll}>{date}</div>
              <div className={classes.descriptionWithPoll}>
                {frontpageDescription?.html &&
                  <ContentStyles contentType="comment">
                    <ContentItemBody
                      dangerouslySetInnerHTML={{__html: frontpageDescription.html}}
                      className={classes.description}
                    />
                  </ContentStyles>
                }
              </div>
            </div>
          </div>
        </div>}
        <div className={classes.contentWithPollMobile}>
          <div className={classes.titleWithPollMobile}>{title}</div>
          <div className={classes.dateWithPoll}>{date}</div>
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
