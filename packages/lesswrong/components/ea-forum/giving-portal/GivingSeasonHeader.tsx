import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  styles as headerStyles,
  forumHeaderTitleSetting,
  forumShortTitleSetting,
  HEADER_HEIGHT,
} from "../../common/Header";
import { makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { heroImageId } from "../../../lib/eaGivingSeason";
import { isEAForum } from "../../../lib/instanceSettings";
import Toolbar from "@material-ui/core/Toolbar";
import Headroom from "../../../lib/react-headroom";
import classNames from "classnames";

export const EA_FORUM_GIVING_SEASON_HEADER_HEIGHT = 213;
const BACKGROUND_ASPECT = 3160 / 800;
const BACKGROUND_WIDTH = Math.round(EA_FORUM_GIVING_SEASON_HEADER_HEIGHT * BACKGROUND_ASPECT);

const GIVING_SEASON_HEADER_IMAGE = makeCloudinaryImageUrl(heroImageId, {
  h: String(EA_FORUM_GIVING_SEASON_HEADER_HEIGHT),
  w: String(BACKGROUND_WIDTH),
  q: "100",
  f: "auto",
  c: "fill",
  g: "center",
});

export const givingSeasonImageBackground = (
  theme: ThemeType,
  position: "top" | "bottom",
) => {
  const width = BACKGROUND_WIDTH;
  const height = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT;
  return {
    transition: "box-shadow 0.2s ease-in-out",
    backgroundColor: theme.palette.givingPortal.homepageHeader.dark,
    backgroundImage: `url(${GIVING_SEASON_HEADER_IMAGE})`,
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${width}px ${height}px`,
    "@media (max-width: 1200px)": {
      backgroundPosition: `${position} right`,
    },
  };
}

export const givingSeasonGradient = (
  theme: ThemeType,
  height = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
) => {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(to right, ${theme.palette.givingPortal.homepageHeader.dark} 10%, ${theme.palette.givingPortal.homepageHeader.main} 28%, ${theme.palette.background.transparent} 50%, ${theme.palette.givingPortal.homepageHeader.main} 72%, ${theme.palette.givingPortal.homepageHeader.dark} 90%)`,
    maxWidth: 1740,
    width: "100%",
    height,
    margin: "0 auto",
    "@media (max-width: 1200px)": {
      background: `linear-gradient(76deg, ${theme.palette.givingPortal.homepageHeader.dark} 10%, ${theme.palette.givingPortal.homepageHeader.main} 40%, ${theme.palette.background.transparent} 70%, ${theme.palette.givingPortal.homepageHeader.main})`,
    },
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  };
}

const styles = (theme: ThemeType) => ({
  ...headerStyles(theme),
  rootGivingSeason: {
    "& .headroom": {
      zIndex: theme.zIndexes.searchResults,
      height: HEADER_HEIGHT,
      overflow: "hidden",
    },
  },
  rootScrolled: {
    "& $appBarGivingSeason": {
      boxShadow: `inset 0 0 0 1000px ${theme.palette.givingPortal.homepageHeader.dark}`,
    },
    "& $givingSeasonGradient": {
      display: "none",
    },
  },
  appBarGivingSeason: {
    ...givingSeasonImageBackground(theme, "top"),
    color: theme.palette.givingPortal.homepageHeader.light4,
    position: "static",
    width: "100%",
    height: EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
    display: "flex",
    boxSizing: "border-box",
    flexDirection: "column",
    padding: "1px 20px",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      background: theme.palette.givingPortal.homepageHeader.dark,
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
  givingSeasonGradient: givingSeasonGradient(theme),
});

const GivingSeasonHeader = ({
  searchOpen,
  hasLogo,
  unFixed,
  setUnFixed,
  NavigationMenuButton,
  RightHeaderItems,
  HeaderNavigationDrawer,
  HeaderNotificationsMenu,
  classes,
}: {
  searchOpen: boolean,
  hasLogo: boolean,
  unFixed: boolean
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
      <div className={classNames(classes.root, classes.rootGivingSeason, {
        [classes.rootScrolled]: !unFixed,
      })}>
        <Headroom
          disableInlineStyles
          downTolerance={10} upTolerance={10}
          height={HEADER_HEIGHT}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
        >
          <header className={classes.appBarGivingSeason}>
            <div className={classes.givingSeasonGradient} />
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
