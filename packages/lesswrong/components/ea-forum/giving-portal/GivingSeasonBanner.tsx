import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { TimelineSpan, eaGivingSeason23ElectionName, timelineSpec, userCanVoteInDonationElection } from "../../../lib/eaGivingSeason";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
  givingSeasonGradient,
  givingSeasonImageBackground,
} from "./GivingSeasonHeader";
import classNames from "classnames";
import moment from "moment";
import { HEADER_HEIGHT } from "../../common/Header";
import { useCurrentUser } from "../../common/withUser";
import { useElectionVote } from "../voting-portal/hooks";

const BANNER_HEIGHT = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT - HEADER_HEIGHT;
const MAX_SPANS = 3;

const styles = (theme: ThemeType) => ({
  root: {
    ...givingSeasonImageBackground(theme, "bottom"),
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: BANNER_HEIGHT,
    padding: "0 20px 20px",
    overflowX: "clip",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "16px",
      marginTop: 0,
      padding: "5px 20px",
      backgroundImage: "none",
      height: "auto",
    },
    ["@media (max-width: 380px)"]: {
      padding: 10,
      paddingBottom: 20,
    },
    ["@media (max-width: 300px)"]: {
      display: "none",
    },
  },
  votingRoot: {
    ...givingSeasonImageBackground(theme, "bottom", true),
    display: 'block',
    padding: "12px 0 30px",
    [theme.breakpoints.down("sm")]: {
      backgroundImage: "none",
    },
    ["@media (max-width: 300px)"]: {
      display: "none",
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
  votingOverview: {
    position: 'relative',
    padding: "0 20px 0 48px",
    [theme.breakpoints.down("sm")]: {
      padding: '0 20px 0 25px',
    },
    [theme.breakpoints.down("xs")]: {
      padding: '0 18px',
    },
  },
  heading: {
    color: theme.palette.givingPortal.homepageHeader.light4,
    fontSize: 40,
    lineHeight: "48px",
    marginTop: 0,
    marginBottom: 8,
    [theme.breakpoints.down("sm")]: {
      marginTop: 4,
      marginBottom: 16,
      fontSize: 30,
      lineHeight: "30px",
    },
  },
  votingHeading: {
    fontSize: 36,
    lineHeight: "44px",
    [theme.breakpoints.down("sm")]: {
      fontSize: 30,
      lineHeight: "38px",
    },
    [theme.breakpoints.down("xs")]: {
      fontSize: 26,
      lineHeight: "34px",
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
      marginRight: 0,
    },
    ["@media (max-width: 600px)"]: {
      marginBottom: 12,
    },
    ["@media (max-width: 380px)"]: {
      display: "none",
    },
  },
  bannerSpan: {
    backgroundColor: theme.palette.givingPortal.homepageHeader.secondaryOpaque,
    padding: "6px 12px",
    borderLeft: `1px solid ${theme.palette.givingPortal.homepageHeader.main}`,
    "&:first-of-type": {
      borderLeft: "none",
      borderTopLeftRadius: theme.borderRadius.small,
      borderBottomLeftRadius: theme.borderRadius.small,
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
  votingTimeline: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: 12,
    height: 30,
    width: '100%',
    backgroundColor: theme.palette.givingPortal.homepageHeader.light3Opaque,
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingLeft: 48,
    paddingRight: 24,
    marginTop: 25,
    [theme.breakpoints.down("sm")]: {
      height: 25,
      justifyContent: 'flex-end',
      paddingRight: 14,
    },
    [theme.breakpoints.down("xs")]: {
      paddingRight: 12,
    }
  },
  votingTimelineSpan: {
    height: '100%',
    width: 226,
    minWidth: 185,
    display: 'flex',
    alignItems: 'center',
    justifyContent: "center",
    textAlign: "center",
    backgroundColor: theme.palette.givingPortal.homepageHeader.light2Opaque,
    color: theme.palette.givingPortal.homepageHeader.main,
    fontSize: 13,
    fontWeight: 600,
    "&:hover": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.light1Opaque,
      opacity: 1
    },
  },
  votingTimelineSpace: {
    width: 42
  },
  votingTimelineBtn: {
    flex: 'none',
    height: 45,
    width: 282,
    display: 'flex',
    alignItems: 'center',
    justifyContent: "center",
    textAlign: "center",
    backgroundColor: theme.palette.givingPortal.homepageHeader.light3,
    color: theme.palette.givingPortal.homepageHeader.main,
    fontSize: 16,
    fontWeight: 600,
    borderRadius: theme.borderRadius.default,
    padding: '0 14px',
    '&:hover': {
      backgroundColor: theme.palette.givingPortal.homepageHeader.light2,
      opacity: 1
    },
    [theme.breakpoints.down("sm")]: {
      height: 36,
    },
    [theme.breakpoints.down("xs")]: {
      width: 'auto'
    }
  },
  voteBtnText: {
    [theme.breakpoints.down("xs")]: {
      display: 'none'
    }
  },
  voteBtnTextMobile: {
    display: 'none',
    [theme.breakpoints.down("xs")]: {
      display: 'inline'
    }
  }
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
  const { electionVote } = useElectionVote(eaGivingSeason23ElectionName);
  const currentUser = useCurrentUser();
  // We only advertise voting for users who are eligible -
  // i.e. those that created their accounts before Oct 23 and haven't voted yet.
  // This involves changing some copy, hiding the banner image, and moving the timeline.
  const advertiseVoting = currentUser && userCanVoteInDonationElection(currentUser) && !electionVote?.submittedAt
  
  const spans = timelineSpec.spans
    .filter(({hatched}) => !hatched) // Ignore the voting time period
    .slice(0, MAX_SPANS);

  const {Typography} = Components;
  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      <div className={classNames(classes.root, {[classes.votingRoot]: advertiseVoting})}>
        <div className={classes.cover} />
        <div className={classes.givingSeasonGradient} />
        <div className={classNames(classes.overview, {[classes.votingOverview]: advertiseVoting})}>
          <Typography
            variant="display1"
            className={classNames(classes.heading, {[classes.votingHeading]: advertiseVoting})}
          >
            {advertiseVoting ? 'Where should we donate?' : 'Giving season 2023'}
          </Typography>
          {!advertiseVoting && <Typography
            variant="body2"
            className={classes.description}
            component="div"
          >
            Donate to the Election Fund and discuss where the donations
            should go.{" "}
            <Link to="/giving-portal" className={classes.givingSeasonLink}>
              Learn more in the Giving portal.
            </Link>
          </Typography>}
        </div>
        {advertiseVoting ? (
          <div className={classes.votingTimeline}>
            {spans.map(span => (
              <Link key={span.description} to={span.href ?? "#"} className={classes.votingTimelineSpan}>
                {span.description}
              </Link>
            ))}
            <div className={classes.votingTimelineSpace}></div>
            <Link to="/giving-portal" className={classes.votingTimelineBtn}>
              <span className={classes.voteBtnText}>Vote in the Donation Election</span>
              <span className={classes.voteBtnTextMobile}>Vote</span>
            </Link>
          </div>
        ) : (
          <div className={classes.timeline}>
            {spans.map((span, i) =>
              <BannerSpan span={span} classes={classes} key={i} />
            )}
            {spans.map((span, i) =>
              <BannerDate span={span} classes={classes} key={i} />
            )}
          </div>
        )}
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
