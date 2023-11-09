import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { TimelineSpan, timelineSpec } from "../../../lib/eaGivingSeason";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { EA_FORUM_HEADER_HEIGHT } from "../../common/Header";
import {
  EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
  givingSeasonGradient,
  givingSeasonImageBackground,
} from "./GivingSeasonHeader";
import classNames from "classnames";
import moment from "moment";

const BANNER_HEIGHT = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT - EA_FORUM_HEADER_HEIGHT;
const MAX_SPANS = 3;

const styles = (theme: ThemeType) => ({
  root: {
    ...givingSeasonImageBackground(theme, "bottom"),
    "@media (max-width: 1200px)": {
      backgroundPosition: "bottom right",
    },
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: BANNER_HEIGHT,
    padding: 20,
    paddingTop: 0,
    overflowX: "clip",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "16px",
      height: "100%",
      marginTop: 0,
    },
  },
  cover: {
    position: "absolute",
    width: "100vw",
    height: 400,
    top: -400,
    left: 0,
    backgroundColor: theme.palette.givingPortal.homepageHeader.dark,
  },
  givingSeasonGradient: givingSeasonGradient(theme, BANNER_HEIGHT),
  overview: {
    padding: "0 20px 0 48px",
    zIndex: 5,
    flexGrow: 1,
    [theme.breakpoints.down("sm")]: {
      padding: 0,
    },
  },
  heading: {
    color: theme.palette.givingPortal.homepageHeader.light4,
    fontSize: 40,
    lineHeight: "48px",
    marginTop: 0,
    marginBottom: 8,
    [theme.breakpoints.down("sm")]: {
      marginTop: 12,
      marginBottom: 16,
      fontSize: 30,
      lineHeight: "30px",
    },
  },
  description: {
    color: theme.palette.givingPortal.homepageHeader.light4,
    paddingLeft: 3,
    maxWidth: 440,
    [theme.breakpoints.down("sm")]: {
      fontSize: 13,
    },
  },
  givingSeasonLink: {
    textDecoration: "underline",
  },
  timeline: {
    maxWidth: 600,
    zIndex: 5,
    display: "grid",
    gridTemplateColumns: `repeat(${MAX_SPANS}, max-content)`,
    alignItems: "center",
    textAlign: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.givingPortal.homepageHeader.light4,
    fontSize: 13,
    fontWeight: 500,
    marginRight: -20,
    "@media (max-width: 1400px)": {
      maxWidth: 480,
      gridTemplateColumns: `repeat(${MAX_SPANS}, auto)`,
    },
    [theme.breakpoints.down("sm")]: {
      alignSelf: "flex-end",
      marginBottom: 16,
    },
    ["@media (max-width: 600px)"]: {
      marginBottom: 12,
    },
    ["@media (max-width: 500px)"]: {
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    ["@media (max-width: 280px)"]: {
      display: "none",
    },
  },
  bannerSpan: {
    backgroundColor: theme.palette.givingPortal.homepageHeader.secondaryOpaque,
    padding: "6px 12px",
    borderLeft: `1px solid ${theme.palette.givingPortal.homepageHeader.main}`,
    "&:first-of-type": {
      borderLeft: "none"
    },
    "&:hover": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.secondaryOpaqueDark,
      opacity: 1
    },
    [theme.breakpoints.down("sm")]: {
      whiteSpace: "nowrap",
      padding: "4px 8px",
    },
  },
  bannerSpanActive: {
    backgroundColor: theme.palette.givingPortal.homepageHeader.light2,
    color: theme.palette.givingPortal.homepageHeader.main,
    fontSize: 16,
    fontWeight: 600,
    padding: "10px 20px",
    borderRadius: theme.borderRadius.default,
    borderLeft: "none",
    "&:hover": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.light1,
      opacity: 1
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: 13,
      padding: "8px 10px",
      borderRadius: theme.borderRadius.default/2,
    },
  },
  bannerDate: {
    paddingTop: 8,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
});

const BannerSpan: FC<{
  span: TimelineSpan,
  classes: ClassesType
}> = ({span: {start, end, description, href}, classes}) => {
  const now = useCurrentTime();
  const isActive = moment.utc(start).isBefore(now) && moment.utc(end).isAfter(now);
  return (
    <Link to={href ?? "#"} className={classNames(classes.bannerSpan, {
      [classes.bannerSpanActive]: isActive,
    })}>
      {description}
    </Link>
  );
}

const BannerDate: FC<{
  span: TimelineSpan,
  classes: ClassesType
}> = ({span: {start, end}, classes}) => (
  <div className={classes.bannerDate}>
    {moment.utc(start).format("MMM D")}-{moment.utc(end).format("D")}
  </div>
);

const GivingSeasonBanner = ({classes}: {classes: ClassesType}) => {
  const spans = timelineSpec.spans
    .filter(({hatched}) => !hatched) // Ignore the voting time period
    .slice(0, MAX_SPANS);

  const {Typography} = Components;
  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      <div className={classes.root}>
        <div className={classes.cover} />
        <div className={classes.givingSeasonGradient} />
        <div className={classes.overview}>
          <Typography
            variant="display1"
            className={classes.heading}
          >
            Giving season 2023
          </Typography>
          <Typography
            variant="body2"
            className={classes.description}
            component="div"
          >
            Donate to the Election Fund and discuss where the donations
            should go.{" "}
            <Link to="/giving-portal" className={classes.givingSeasonLink}>
              Learn more in the Giving portal.
            </Link>
          </Typography>
        </div>
        <div className={classes.timeline}>
          {spans.map((span, i) =>
            <BannerSpan span={span} classes={classes} key={i} />
          )}
          {spans.map((span, i) =>
            <BannerDate span={span} classes={classes} key={i} />
          )}
        </div>
      </div>
    </AnalyticsContext>
  );
}

const GivingSeasonBannerComponent = registerComponent(
  "GivingSeasonBanner",
  GivingSeasonBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    GivingSeasonBanner: typeof GivingSeasonBannerComponent
  }
}
