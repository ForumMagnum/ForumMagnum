import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { timelineSpec } from "../../../lib/eaGivingSeason";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import Typography from "@material-ui/core/Typography";
import classNames from "classnames";
import moment from "moment";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { EA_FORUM_HEADER_HEIGHT } from "../../common/Header";
import { EA_FORUM_GIVING_SEASON_HEADER_HEIGHT } from "./GivingSeasonHeader";

const BANNER_HEIGHT = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT - EA_FORUM_HEADER_HEIGHT;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    height: BANNER_HEIGHT,
    zIndex: theme.zIndexes.spotlightItem,
    background: theme.palette.givingPortal.homepageHeader.dark,
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "16px",
      height: "100%",
      marginTop: 0,
    },
  },
  givingSeasonOverview: {
    padding: "0 20px 0 48px",
    flexGrow: 1,
    [theme.breakpoints.down("sm")]: {
      padding: 0,
    },
  },
  givingSeasonHeading: {
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
  givingSeasonDescription: {
    color: theme.palette.givingPortal.homepageHeader.light4,
    paddingLeft: 3,
    maxWidth: 500,
    [theme.breakpoints.down("sm")]: {
      fontSize: 13,
    },
  },
  givingSeasonLink: {
    textDecoration: "underline",
  },
  givingSeasonTimeline: {
    maxWidth: 600,
    display: "grid",
    gridTemplateColumns: "repeat(3, max-content)",
    alignItems: "center",
    textAlign: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.givingPortal.homepageHeader.light4,
    fontSize: 13,
    fontWeight: 500,
    marginRight: -20,
    "@media (max-width: 1400px)": {
      maxWidth: 480,
      gridTemplateColumns: "repeat(3, auto)",
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
  gsTimelineLabel: {
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
  gsTimelineLabelActive: {
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
  gsTimelineDates: {
    paddingTop: 8,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
});

const GivingSeasonBanner = ({className, classes}: {
  className?: string,
  classes: ClassesType,
}) => {
  const now = useCurrentTime();
  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      <div className={classNames(classes.root, className)}>
        <div className={classes.givingSeasonOverview}>
          <Typography variant="display1" className={classes.givingSeasonHeading}>
            Giving season 2023
          </Typography>
          <Typography variant="body2" className={classes.givingSeasonDescription} component="div">
            Donate to the Election Fund and discuss where the donations should go. <Link to="/giving-portal" className={classes.givingSeasonLink}>Learn more in the Giving portal.</Link>
          </Typography>
        </div>
        <div className={classes.givingSeasonTimeline}>
          {timelineSpec.spans.map((span) => {
            // ignore the voting time period
            if (span.hatched) return null
            const isActive = moment.utc(span.start).isBefore(now) && moment.utc(span.end).isAfter(now)
            return <Link
              key={`${span.description}-label`}
              to={span.href ?? "#"}
              className={classNames(classes.gsTimelineLabel, {[classes.gsTimelineLabelActive]: isActive})}
            >
              {span.description}
            </Link>
          })}
          {timelineSpec.spans.map(span => {
            if (span.hatched) return null
            return <div key={`${span.description}-dates`} className={classes.gsTimelineDates}>
              {moment.utc(span.start).format("MMM D")}-{moment.utc(span.end).format("D")}
            </div>
          })}
        </div>
      </div>
    </AnalyticsContext>
  );
}

const GivingSeasonBannerComponent = registerComponent(
  "GivingSeasonBanner",
  GivingSeasonBanner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    GivingSeasonBanner: typeof GivingSeasonBannerComponent
  }
}
