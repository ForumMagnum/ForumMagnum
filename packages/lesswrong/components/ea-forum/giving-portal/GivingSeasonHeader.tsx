import React, { FC, ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useIsAboveBreakpoint } from "../../hooks/useScreenWidth";
import { Link } from "../../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  styles as headerStyles,
  forumHeaderTitleSetting,
  forumShortTitleSetting,
} from "../../common/Header";
import { CloudinaryPropsType, makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { eaGivingSeason23ElectionName, headerImageId, heroImageId, votingHeaderImageId } from "../../../lib/eaGivingSeason";
import { isEAForum } from "../../../lib/instanceSettings";
import Toolbar from "@material-ui/core/Toolbar";
import Headroom from "../../../lib/react-headroom";
import classNames from "classnames";
import { useLocation } from "../../../lib/routeUtil";
import { useElectionVote } from "../voting-portal/hooks";

export const EA_FORUM_GIVING_SEASON_HEADER_HEIGHT = 213;
const BACKGROUND_ASPECT = 3160 / 800;
const BACKGROUND_WIDTH = Math.round(EA_FORUM_GIVING_SEASON_HEADER_HEIGHT * BACKGROUND_ASPECT);

export const givingSeasonImageBackground = (
  theme: ThemeType,
  position: "top" | "bottom",
  isVotingImg?: boolean
) => {
  const imgUrl = makeCloudinaryImageUrl(
    isVotingImg ? votingHeaderImageId : headerImageId,
    {
      h: String(EA_FORUM_GIVING_SEASON_HEADER_HEIGHT),
      w: String(BACKGROUND_WIDTH),
      q: "100",
      f: "auto",
      c: "fill",
      g: "center",
    }
  )
  
  const width = BACKGROUND_WIDTH;
  const height = EA_FORUM_GIVING_SEASON_HEADER_HEIGHT;
  return {
    transition: "box-shadow 0.2s ease-in-out",
    backgroundColor: theme.palette.givingPortal.homepageHeader.dark,
    backgroundImage: `url(${imgUrl})`,
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
      background: `linear-gradient(to right, ${theme.palette.givingPortal.homepageHeader.dark} 10%, ${theme.palette.givingPortal.homepageHeader.main} 40%, ${theme.palette.background.transparent} 70%, ${theme.palette.givingPortal.homepageHeader.main})`,
    },
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  };
}

const styles = (theme: ThemeType) => ({
  ...headerStyles(theme),
  rootGivingSeason: {
    height: `${EA_FORUM_GIVING_SEASON_HEADER_HEIGHT}px !important`,
    marginBottom: -20,
    "& .headroom": {
      zIndex: theme.zIndexes.searchResults,
      height: EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
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
  leftHeaderItems: {
    display: "flex",
    alignItems: "center",
  },
  homePageBackground: {
    background: theme.palette.givingPortal.homepageHeader.light2,
  },
  solidBackground: {
    background: theme.palette.givingPortal.homepageHeader.dark,
  },
  appBarGivingSeason: {
    color: theme.palette.givingPortal.homepageHeader.main,
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
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .SearchBar-searchIcon": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .ais-SearchBox-input": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .ais-SearchBox-input::placeholder": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .KarmaChangeNotifier-starIcon": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .KarmaChangeNotifier-gainedPoints": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .NotificationsMenuButton-badge": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .NotificationsMenuButton-buttonClosed": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .UsersMenu-arrowIcon": {
      color: theme.palette.givingPortal.homepageHeader.main,
    },
    "& .EAButton-variantContained": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.light2,
      color: theme.palette.givingPortal.homepageHeader.main,
      "&:hover": {
        backgroundColor: theme.palette.givingPortal.homepageHeader.light1,
      },
    },
    "& .EAButton-greyContained": {
      backgroundColor: theme.palette.givingPortal.homepageHeader.main,
      color: theme.palette.givingPortal.homepageHeader.light3,
      "&:hover": {
        backgroundColor: `${theme.palette.givingPortal.homepageHeader.secondaryDark} !important`,
      },
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
    color: theme.palette.givingPortal.homepageHeader.main,
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
      gap: '16px',
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
  },
  gsContent: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 36,
    fontWeight: 700,
    lineHeight: "120%",
    letterSpacing: "-0.76px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    justifyContent: "center",
    height: "100%",
  },
  gsButtons: {
    display: "flex",
    gap: "20px",
    "& .EAButton-variantContained": {
      background: theme.palette.text.alwaysWhite,
      fontWeight: 600,
    },
  },
});

const votingPortalSocialImageProps: CloudinaryPropsType = {
  dpr: "auto",
  ar: "16:9",
  w: "1200",
  c: "fill",
  g: "center",
  q: "auto",
  f: "auto",
};

const GivingSeasonHeader = ({
  searchOpen,
  hasLogo,
  unFixed,
  setUnFixed,
  NavigationMenuButton,
  rightHeaderItems,
  HeaderNavigationDrawer,
  HeaderNotificationsMenu,
  classes,
}: {
  searchOpen: boolean,
  hasLogo: boolean,
  unFixed: boolean
  setUnFixed: (value: boolean) => void,
  NavigationMenuButton: FC,
  rightHeaderItems: ReactNode,
  HeaderNavigationDrawer: FC,
  HeaderNotificationsMenu: FC,
  classes: ClassesType<typeof styles>,
}) => {
  const {Typography, HeadTags, HeaderSubtitle, EAButton} = Components;
  const isDesktop = useIsAboveBreakpoint("md");
  const { pathname, currentRoute } = useLocation();
  const { electionVote } = useElectionVote(eaGivingSeason23ElectionName);

  const compareAllowed = electionVote?.vote && Object.values(electionVote.vote).length > 1;
  const allocateAllowed = electionVote?.vote && Object.values(electionVote.vote).length > 0;
  const submitAllowed = electionVote?.vote && Object.values(electionVote.vote).some((value) => value);

  const votingSteps = [
    {
      label: '1. Select candidates',
      href: '/voting-portal/select-candidates',
    },
    {
      label: '2. Compare',
      href: '/voting-portal/compare',
      disabled: !compareAllowed,
    },
    {
      label: '3. Finalize points',
      href: '/voting-portal/allocate-points',
      disabled: !allocateAllowed,
    },
    {
      label: '4. Submit',
      href: '/voting-portal/submit',
      disabled: !submitAllowed,
    },
  ]

  const isVotingPortal = pathname.startsWith("/voting-portal");
  // Show voting steps if we are on a path like /voting-portal/compare (with anything after /voting-portal/)
  const showVotingSteps = isVotingPortal && /\/voting-portal\/\w/.test(pathname);
  const showHearts = currentRoute?.path === "/";

  return (
    <AnalyticsContext pageSectionContext="header" siteEvent="givingSeason2023">
      {isVotingPortal && (
        <HeadTags
          title="Voting portal"
          description="Vote in the EA Forum Donation Election"
          image={makeCloudinaryImageUrl(heroImageId, votingPortalSocialImageProps)}
        />
      )}
      <div
        className={classNames(classes.root, classes.rootGivingSeason, {
          [classes.rootScrolled]: !unFixed,
        })}
      >
        <Headroom
          disableInlineStyles
          downTolerance={10}
          upTolerance={10}
          height={EA_FORUM_GIVING_SEASON_HEADER_HEIGHT}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
          disable={isDesktop}
        >
          <header
            className={classNames(
              classes.appBarGivingSeason,
              showHearts ? classes.homePageBackground : classes.solidBackground,
            )}
          >
            <Toolbar disableGutters={isEAForum} className={classes.toolbarGivingSeason}>
              <div className={classes.leftHeaderItems}>
                <NavigationMenuButton />
                <Typography className={classes.title} variant="title">
                  <div className={isVotingPortal ? classes.hideMdDown : classes.hideSmDown}>
                    <div className={classes.titleSubtitleContainer}>
                      <Link to={"/"} className={classNames(classes.titleLink, classes.titleLinkGivingSeason)}>
                        {hasLogo && (
                          <div className={classNames(classes.siteLogo, classes.siteLogoGivingSeason)}>
                            {lightbulbIcon}
                          </div>
                        )}
                        {isVotingPortal ? forumShortTitleSetting.get() : forumHeaderTitleSetting.get()}
                      </Link>
                      <span className={classes.hideMdDown}><HeaderSubtitle /></span>
                    </div>
                  </div>
                  <div className={isVotingPortal ? classes.hideLgUp : classes.hideMdUp}>
                    <div className={classes.titleSubtitleContainer}>
                      <Link to={"/"} className={classNames(classes.titleLink, classes.titleLinkGivingSeason)}>
                        {hasLogo && (
                          <div className={classNames(classes.siteLogo, classes.siteLogoGivingSeason)}>
                            {lightbulbIcon}
                          </div>
                        )}
                        {forumShortTitleSetting.get()}
                      </Link>
                      <span className={classes.hideMdDown}><HeaderSubtitle /></span>
                    </div>
                  </div>
                </Typography>
              </div>
              {showVotingSteps && (
                <div className={classNames(classes.navigationSteps, classes.hideSmDown)}>
                  {votingSteps.map(({ label, href, disabled }) =>
                    disabled ? (
                      <span
                        key={href}
                        className={classNames(classes.disabledStepLink, {
                          [classes.activeStepLink]: pathname === href,
                        })}
                      >
                        {label}
                      </span>
                    ) : (
                      <Link
                        key={href}
                        to={href}
                        className={classNames({
                          [classes.activeStepLink]: pathname === href,
                        })}
                      >
                        {label}
                      </Link>
                    )
                  )}
                </div>
              )}
              {rightHeaderItems}
            </Toolbar>
            <div className={classes.gsContent}>
              <div>Add a heart if you got your 2023 donations in</div>
              <div className={classes.gsButtons}>
                <EAButton>
                  Donate to the Donation Election winners
                </EAButton>
                <EAButton>
                  Explore charities
                </EAButton>
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
