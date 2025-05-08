import React, { useCallback, useRef } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { Link } from "@/lib/reactRouterWrapper";
import { useTheme } from "@/components/themes/useTheme";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { lightbulbIcon } from "@/components/icons/lightbulbIcon";
import { formatPercentile, getUserProfileLink } from "./wrappedHelpers";
import { useForumWrappedContext } from "./hooks";
import { getWrappedVideo } from "./videos";
import classNames from "classnames";

const TOP_PADDING = 12;
const BOTTOM_PADDING = 14;
const DESKTOP_IMAGE_SIZE = 300;
const MOBILE_IMAGE_SIZE = 120;
const DESKTOP_GAP = "32px";
const MOBILE_GAP = "20px";

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: 10,
  },
  container: {
    width: "100%",
    maxWidth: 500,
    padding: `${TOP_PADDING}px 24px ${BOTTOM_PADDING}px`,
    color: theme.palette.text.alwaysWhite,
    display: "flex",
    flexDirection: "column",
    gap: MOBILE_GAP,
    textAlign: "left",
    margin: "0 auto 20px",
    [theme.breakpoints.up("md")]: {
      maxWidth: 800,
      marginTop: 40,
      marginBottom: 40,
      padding: "32px 28px 22px",
      gap: DESKTOP_GAP,
    },
  },
  transparent: {},
  grey: {
    background: theme.palette.wrapped.personality.grey,
  },
  red: {
    background: theme.palette.wrapped.personality.red,
  },
  blue: {
    background: theme.palette.wrapped.personality.blue,
  },
  green: {
    background: theme.palette.wrapped.personality.green,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: MOBILE_GAP,
    [theme.breakpoints.up("md")]: {
      gap: DESKTOP_GAP,
      flexDirection: "row-reverse",
      alignItems: "center",
    },
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: MOBILE_GAP,
    flexGrow: 1,
    [theme.breakpoints.up("md")]: {
      gap: DESKTOP_GAP,
    },
  },
  row: {
    display: "flex",
    flexDirection: "row",
    gap: "22px",
  },
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "unset",
    },
  },
  image: {
    width: "auto",
    height: "auto",
    maxWidth: MOBILE_IMAGE_SIZE,
    maxHeight: MOBILE_IMAGE_SIZE,
    [theme.breakpoints.up("md")]: {
      maxWidth: DESKTOP_IMAGE_SIZE,
      maxHeight: DESKTOP_IMAGE_SIZE,
    },
  },
  heading: {
    fontSize: 12,
    lineHeight: "15px",
    fontWeight: 500,
    marginBottom: 2,
    [theme.breakpoints.up("md")]: {
      fontSize: 13,
      lineHeight: "16px",
    },
  },
  personality: {
    fontSize: 22,
    lineHeight: "28px",
    fontWeight: 700,
    letterSpacing: "-0.48px",
    [theme.breakpoints.up("md")]: {
      fontSize: 32,
      lineHeight: "38px",
      letterSpacing: "-0.64px",
    },
  },
  stat: {
    fontSize: 22,
    lineHeight: "22px",
    fontWeight: 700,
    letterSpacing: "-0.48px",
    [theme.breakpoints.up("md")]: {
      fontSize: 32,
      lineHeight: "32px",
      letterSpacing: "-0.64px",
    },
  },
  lists: {
    display: "flex",
    flexDirection: "column",
    gap: MOBILE_GAP,
    [theme.breakpoints.up("md")]: {
      gap: DESKTOP_GAP,
      flexDirection: "row",
      justifyContent: "space-between",
    },
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    marginTop: 6,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 600,
    letterSpacing: '0.2px',
    textWrap: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  iconPlaceholder: {
    width: 16,
    height: 16,
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: 400,
    lineHeight: "110%",
    letterSpacing: "0.39px",
  },
  footerLightbulb: {
    width: 22,
  },
  shareContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 50,
  },
});

/**
 * Section that displays a screenshottable summary of the user's Wrapped data
 */
const WrappedSummarySectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    year,
    data: {
      engagementPercentile,
      postsReadCount,
      karmaChange,
      mostReadAuthors,
      mostReadTopics,
      personality,
    },
  } = useForumWrappedContext();
  const {color, frame} = getWrappedVideo(personality);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const formattedPercentile = formatPercentile(engagementPercentile);
  const theme = useTheme();

  // There's a horrible line of white background at the bottom of the image
  // because of a bug in html2canvas - cover it up
  const onRendered = useCallback((canvas: HTMLCanvasElement) => {
    try {
      const img = imageRef.current;
      const ctx = canvas.getContext("2d");
      if (img && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const coverHeight = (BOTTOM_PADDING * dpr) - 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = theme.palette.wrapped.personality[color];
        ctx.fillRect(0, canvas.height - coverHeight, canvas.width, coverHeight * 2);
        ctx.fillRect(canvas.width - 2, 0, 2, canvas.height);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, [color, theme]);

  const {
    WrappedSection, UsersProfileImage, CoreTagIcon, WrappedShareButton,
  } = Components;
  return (
    <WrappedSection
      pageSectionContext="summary"
      noPadding
      fullWidth
      className={classes.root}
    >
      <div
        className={classNames(classes.container, classes[color])}
        ref={screenshotRef}
      >
        <div className={classes.content}>
          <div className={classes.imageContainer}>
            <img
              src={frame}
              className={classes.image}
              crossOrigin="anonymous"
              ref={imageRef}
            />
          </div>
          <div className={classes.info}>
            <div>
              <div className={classes.heading}>EA Forum personality</div>
              <div className={classes.personality}>{personality}</div>
            </div>
            <div className={classes.row}>
              <div>
                <div className={classes.heading}>Top reader</div>
                <div className={classes.stat}>{formattedPercentile}%</div>
              </div>
              <div>
                <div className={classes.heading}>Posts read</div>
                <div className={classes.stat}>{postsReadCount}</div>
              </div>
              {karmaChange > 0 && (
                <div>
                  <div className={classes.heading}>Karma</div>
                  <div className={classes.stat}>+{karmaChange}</div>
                </div>
              )}
            </div>
            {(mostReadAuthors.length > 0 || mostReadTopics.length > 0) &&
              <div className={classes.lists}>
                {mostReadAuthors.length > 0 &&
                  <div>
                    <div className={classes.heading}>Most-read authors</div>
                    <div className={classes.list}>
                      {mostReadAuthors.slice(0,3).map((author) => (
                        <div key={author.slug} className={classes.listItem}>
                          <UsersProfileImage size={20} user={author} />
                          <Link to={getUserProfileLink(author.slug, year)} target="_blank">
                            {author.displayName}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                }
                {mostReadTopics.length > 0 &&
                  <div>
                    <div className={classes.heading}>Most-read topics</div>
                    <div className={classes.list}>
                      {mostReadTopics.map((topic) => (
                        <div key={topic.slug} className={classes.listItem}>
                          <CoreTagIcon
                            tag={topic}
                            fallbackNode={
                              <div className={classes.iconPlaceholder} />
                            }
                          />
                          <Link to={tagGetUrl({slug: topic.slug})} target="_blank">
                            {topic.name}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
        <div className={classes.footer}>
          <div className={classes.footerLightbulb}>{lightbulbIcon}</div>
          <div>forum.effectivealtruism.org/wrapped</div>
        </div>
      </div>
      <div className={classes.shareContainer}>
        <WrappedShareButton
          name="Summary"
          screenshotRef={screenshotRef}
          onRendered={onRendered}
        />
      </div>
    </WrappedSection>
  );
}

export const WrappedSummarySection = registerComponent(
  "WrappedSummarySection",
  WrappedSummarySectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedSummarySection: typeof WrappedSummarySection
  }
}
