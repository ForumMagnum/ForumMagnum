import React, { FC } from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "react-router-dom";
import {
  styles as headerStyles,
  forumHeaderTitleSetting,
  forumShortTitleSetting,
} from "../../common/Header";
import { cloudinaryCloudNameSetting } from "../../../lib/publicSettings";
import { timelineSpec } from "../../../lib/eaGivingSeason";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import Headroom from "../../../lib/react-headroom";
import classNames from "classnames";
import moment from "moment";
import { isEAForum } from "../../../lib/instanceSettings";

const cloudinaryCloudName = cloudinaryCloudNameSetting.get();
const gsImg = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_crop,g_custom/h_300,q_100,f_auto/giving_portal_23_hero`;

const EA_FORUM_GIVING_SEASON_HEADER_HEIGHT = 213;

const styles = (theme: ThemeType) => ({
  ...headerStyles(theme),
  rootGivingSeason: {
    height: EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
    "& .headroom": {
      zIndex: theme.zIndexes.searchResults,
    },
  },
  appBarGivingSeason: {
    color: theme.palette.givingPortal.homepageHeader.light4,
    background: `center no-repeat url(${gsImg}), ${theme.palette.givingPortal.homepageHeader.dark}`,
    position: "static",
    width: "100%",
    height: EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
    display: "flex",
    zIndex: 1100,
    boxSizing: "border-box",
    flexShrink: 0,
    flexDirection: "column",
    padding: "1px 20px",
    overflow: "hidden",
    "@media (max-width: 1200px)": {
      background: `right no-repeat url(${gsImg}), ${theme.palette.givingPortal.homepageHeader.dark}`,
    },
    [theme.breakpoints.down("sm")]: {
      background: theme.palette.givingPortal.homepageHeader.main,
    },
    [theme.breakpoints.down("xs")]: {
      padding: "9px 11px",
    },

    "& .HeaderSubtitle-subtitle": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .SearchBar-searchIcon": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .ais-SearchBox-input": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .ais-SearchBox-input::placeholder": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .KarmaChangeNotifier-starIcon": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .KarmaChangeNotifier-gainedPoints": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .NotificationsMenuButton-badge": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .NotificationsMenuButton-buttonClosed": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .UsersMenu-arrowIcon": {
      color: theme.palette.givingPortal.homepageHeader.light4,
    },
    "& .EAButton-variantContained": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.light2,
      color: theme.palette.givingPortal.homepageHeader.main,
      "&:hover": {
        backgroundColor: theme.palette.givingPortal.homepageHeader.light1,
      },
    },
    "& .EAButton-greyContained": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.secondary,
      color: theme.palette.givingPortal.homepageHeader.light3,
      "&:hover": {
        backgroundColor: `${theme.palette.givingPortal.homepageHeader.secondaryDark} !important`,
      },
    },
  },
  toolbarGivingSeason: {
    zIndex: theme.zIndexes.spotlightItem,
  },
  siteLogoGivingSeason: {
    width: 34,
    [theme.breakpoints.down("sm")]: {
      width: 30,
    },
  },
  titleLinkGivingSeason: {
    color: theme.palette.givingPortal.homepageHeader.light4,
  },
  givingSeasonSubtitle: {
    display: "none",
    [theme.breakpoints.down("sm")]: {
      display: "block",
      marginLeft: "1em",
      paddingLeft: "1em",
      borderLeft: `1px solid ${theme.palette.givingPortal.homepageHeader.light4}`,
    },
    "@media (max-width: 640px)": {
      display: "none",
    },
  },
  givingSeasonMobileLink: {
    color: theme.palette.givingPortal.homepageHeader.light4,
  },
  givingSeasonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(to right, ${theme.palette.givingPortal.homepageHeader.dark} 10%, ${theme.palette.givingPortal.homepageHeader.main} 28%, ${theme.palette.background.transparent} 50%, ${theme.palette.givingPortal.homepageHeader.main} 72%, ${theme.palette.givingPortal.homepageHeader.dark} 90%)`,
    maxWidth: 1740,
    width: "100%",
    height: EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
    margin: "0 auto",
    "@media (max-width: 1200px)": {
      background: `linear-gradient(76deg, ${theme.palette.givingPortal.homepageHeader.dark} 10%, ${theme.palette.givingPortal.homepageHeader.main} 40%, ${theme.palette.background.transparent} 70%, ${theme.palette.givingPortal.homepageHeader.main})`,
    },
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  givingSeasonContent: {
    display: "flex",
    alignItems: "center",
    marginTop: 16,
    zIndex: theme.zIndexes.spotlightItem,
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

const GivingSeasonHeader = ({
  searchOpen,
  hasLogo,
  setUnFixed,
  NavigationMenuButton,
  RightHeaderItems,
  HeaderNavigationDrawer,
  HeaderNotificationsMenu,
  classes,
}: {
  searchOpen: boolean,
  hasLogo: boolean,
  setUnFixed: (value: boolean) => void,
  NavigationMenuButton: FC,
  RightHeaderItems: FC,
  HeaderNavigationDrawer: FC,
  HeaderNotificationsMenu: FC,
  classes: ClassesType,
}) => {
  const now = useCurrentTime();
  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      <div className={classes.rootGivingSeason}>
        <Headroom
          disableInlineStyles
          downTolerance={10} upTolerance={10}
          height={EA_FORUM_GIVING_SEASON_HEADER_HEIGHT}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
          disable={false}
        >
          <header className={classes.appBarGivingSeason}>
            <div className={classes.givingSeasonGradient}></div>
            <Toolbar disableGutters={isEAForum} className={classes.toolbarGivingSeason}>
              <NavigationMenuButton />
              <Typography className={classes.title} variant="title">
                <div className={classes.hideSmDown}>
                  <div className={classes.titleSubtitleContainer}>
                    <Link to="/" className={classNames(classes.titleLink, classes.titleLinkGivingSeason)}>
                      {hasLogo && <div className={classNames(classes.siteLogo, classes.siteLogoGivingSeason)}>
                        {lightbulbIcon}
                      </div>}
                      {forumHeaderTitleSetting.get()}
                    </Link>
                  </div>
                </div>
                <div className={classes.hideMdUp}>
                  <div className={classes.titleSubtitleContainer}>
                    <Link to="/" className={classNames(classes.titleLink, classes.titleLinkGivingSeason)}>
                      {hasLogo && <div className={classNames(classes.siteLogo, classes.siteLogoGivingSeason)}>
                        {lightbulbIcon}
                      </div>}
                      {forumShortTitleSetting.get()}
                    </Link>
                    <div className={classes.givingSeasonSubtitle}>
                      <Link to="/giving-portal" className={classes.givingSeasonMobileLink}>
                        Giving season 2023
                      </Link>
                    </div>
                  </div>
                </div>
              </Typography>
              <RightHeaderItems />
            </Toolbar>
            <div className={classes.givingSeasonContent}>
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
          </header>
          <HeaderNavigationDrawer />
        </Headroom>
        <HeaderNotificationsMenu />
      </div>
    </AnalyticsContext>
  );
}

const GivingSeasonHeaderComponent = registerComponent(
  "GivingSeasonHeader",
  GivingSeasonHeader,
  {styles},
);

declare global {
  interface ComponentTypes {
    GivingSeasonHeader: typeof GivingSeasonHeaderComponent
  }
}
