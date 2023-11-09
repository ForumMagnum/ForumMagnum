import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  styles as headerStyles,
  forumHeaderTitleSetting,
  forumShortTitleSetting,
  EA_FORUM_HEADER_HEIGHT,
} from "../../common/Header";
import { makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { heroImageId } from "../../../lib/eaGivingSeason";
import { isEAForum } from "../../../lib/instanceSettings";
import Toolbar from "@material-ui/core/Toolbar";
import Headroom from "../../../lib/react-headroom";
import classNames from "classnames";

export const EA_FORUM_GIVING_SEASON_HEADER_HEIGHT = 213;
const BACKGROUND_IMAGE_WIDTH = 531;

const GIVING_SEASON_HEADER_IMAGE = makeCloudinaryImageUrl(heroImageId, {
  h: String(EA_FORUM_GIVING_SEASON_HEADER_HEIGHT),
  w: String(BACKGROUND_IMAGE_WIDTH),
  q: "100",
  f: "auto",
  dpr: "2",
});

export const givingSeasonImageBackground = (
  theme: ThemeType,
  position: "top" | "left" | "bottom" | "right" | "center",
) => {
  const width = BACKGROUND_IMAGE_WIDTH;
  const height = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT;
  return {
    background: [
      `${position} no-repeat url(${GIVING_SEASON_HEADER_IMAGE})`,
      theme.palette.givingPortal.homepageHeader.dark,
    ],
    backgroundSize: `${width}px ${height}px`,
  };
}

const styles = (theme: ThemeType) => ({
  ...headerStyles(theme),
  rootGivingSeason: {
    overflow: "hidden",
    "& .headroom": {
      zIndex: theme.zIndexes.searchResults,
    },
  },
  appBarGivingSeason: {
    ...givingSeasonImageBackground(theme, "top"),
    color: theme.palette.givingPortal.homepageHeader.light4,
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
      background: [
        `right no-repeat url(${GIVING_SEASON_HEADER_IMAGE})`,
        theme.palette.givingPortal.homepageHeader.dark,
      ],
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
    display: "none",// TMP TODO
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
  const {Typography} = Components;
  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      <div className={classNames(classes.root, classes.rootGivingSeason)}>
        <Headroom
          disableInlineStyles
          downTolerance={10} upTolerance={10}
          height={EA_FORUM_HEADER_HEIGHT}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
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
