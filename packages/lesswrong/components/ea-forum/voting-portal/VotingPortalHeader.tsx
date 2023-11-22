import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  styles as headerStyles,
  HEADER_HEIGHT,
} from "../../common/Header";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import Toolbar from "@material-ui/core/Toolbar";
import Headroom from "../../../lib/react-headroom";
import classNames from "classnames";
import { useLocation } from "../../../lib/routeUtil";
import { CloudinaryPropsType, makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";
import { heroImageId } from "../../../lib/eaGivingSeason";

const styles = (theme: ThemeType) => ({
  ...headerStyles(theme),
  rootGivingSeason: {
    "& .headroom": {
      zIndex: theme.zIndexes.searchResults,
      height: HEADER_HEIGHT,
      overflow: "hidden",
    },
  },
  leftHeaderItems: {
    display: "flex",
    alignItems: "center",
  },
  appBarGivingSeason: {
    background: theme.palette.givingPortal.homepageHeader.dark,
    color: theme.palette.givingPortal.homepageHeader.light4,
    position: "static",
    width: "100%",
    height: HEADER_HEIGHT,
    display: "flex",
    boxSizing: "border-box",
    flexDirection: "column",
    padding: "1px 20px",
    overflow: "hidden",
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
  hideLgUp: {
    [theme.breakpoints.up('lg')]: {
      display: "none !important"
    }
  },
  hideMdDown: {
    [theme.breakpoints.down('md')]: {
      display: "none !important"
    }
  },
  hideSmDown: {
    [theme.breakpoints.down('sm')]: {
      display: "none !important",
    },
  },
  hideXsDown: {
    [theme.breakpoints.down('xs')]: {
      display: "none !important",
    },
  },
  hideMdUp: {
    [theme.breakpoints.up('md')]: {
      display: "none !important",
    },
  },
  toolbarGivingSeason: {
    zIndex: theme.zIndexes.spotlightItem,
    justifyContent: "space-between",
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
  navigationSteps: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    fontSize: 16,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('md')]: {
      gap: '12px',
    }
  },
  activeStepLink: {
    textUnderlineOffset: '6px',
    textDecoration: 'underline',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  disabledStepLink: {
    opacity: 0.7,
  }
});

const socialImageProps: CloudinaryPropsType = {
  dpr: "auto",
  ar: "16:9",
  w: "1200",
  c: "fill",
  g: "center",
  q: "auto",
  f: "auto",
};

const VOTING_STEPS = [
  {
    label: '1. Select candidates',
    href: '/voting-portal/select-candidates',
  },
  {
    label: '2. Compare',
    href: '/voting-portal/compare',
  },
  {
    label: '3. Allocate votes',
    href: '/voting-portal/allocate-votes',
  },
  {
    label: '4. Submit',
    href: '/voting-portal/submit',
  },
] as const

const VotingPortalHeader = ({
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
  const { Typography, HeadTags } = Components;
  const { pathname } = useLocation();

  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      <HeadTags
        title="Donation Election: voting portal"
        description="Vote in the EA Forum Donation Election"
        image={makeCloudinaryImageUrl(heroImageId, socialImageProps)}
      />
      <div
        className={classNames(classes.root, classes.rootGivingSeason, {
          [classes.rootScrolled]: !unFixed,
        })}
      >
        <Headroom
          disableInlineStyles
          downTolerance={10}
          upTolerance={10}
          height={HEADER_HEIGHT}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
        >
          <header className={classes.appBarGivingSeason}>
            <Toolbar disableGutters={true} className={classes.toolbarGivingSeason}>
              <div className={classes.leftHeaderItems}>
                <NavigationMenuButton />
                <Typography className={classes.title} variant="title">
                  <div className={classes.hideMdDown}>
                    <div className={classes.titleSubtitleContainer}>
                      <Link to="/voting-portal" className={classNames(classes.titleLink, classes.titleLinkGivingSeason)}>
                        {hasLogo && (
                          <div className={classNames(classes.siteLogo, classes.siteLogoGivingSeason)}>
                            {lightbulbIcon}
                          </div>
                        )}
                        Donation Election: Voting portal
                      </Link>
                    </div>
                  </div>
                  <div className={classes.hideLgUp}>
                    <div className={classes.titleSubtitleContainer}>
                      <Link to="/voting-portal" className={classNames(classes.titleLink, classes.titleLinkGivingSeason)}>
                        {hasLogo && (
                          <div className={classNames(classes.siteLogo, classes.siteLogoGivingSeason)}>
                            {lightbulbIcon}
                          </div>
                        )}
                        Voting portal
                      </Link>
                    </div>
                  </div>
                </Typography>
              </div>
              <div className={classNames(classes.navigationSteps, classes.hideSmDown)}>
                {VOTING_STEPS.map(({ label, href }) => (
                  <Link
                    key={href}
                    to={href}
                    className={classNames(classes.stepLink, {
                      [classes.activeStepLink]: pathname === href,
                      // TODO: make this based on what they have completed so far
                      [classes.disabledStepLink]: label === "4. Submit",
                    })}
                  >
                    {label}
                  </Link>
                ))}
              </div>
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

const VotingPortalHeaderComponent = registerComponent(
  "VotingPortalHeader",
  VotingPortalHeader,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalHeader: typeof VotingPortalHeaderComponent
  }
}
