// TODO delete
import React, { FC, MouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useIsAboveBreakpoint } from "../../hooks/useScreenWidth";
import { Link } from "../../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  styles as headerStyles,
  forumHeaderTitleSetting,
  forumShortTitleSetting,
  HEADER_HEIGHT,
} from "../../common/Header";
import { CloudinaryPropsType, makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { GivingSeasonHeart, eaGivingSeason23ElectionName, headerImageId, heroImageId, votingHeaderImageId } from "../../../lib/eaGivingSeason";
import { isEAForum } from "../../../lib/instanceSettings";
import Toolbar from "@material-ui/core/Toolbar";
import Headroom from "../../../lib/react-headroom";
import classNames from "classnames";
import { useLocation } from "../../../lib/routeUtil";
import { useElectionVote } from "../voting-portal/hooks";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useCurrentUser } from "../../common/withUser";
import NoSSR from "react-no-ssr";

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
    [theme.breakpoints.down("sm")]: {
      height: `${HEADER_HEIGHT}px !important`,
      marginBottom: 0,
    },
    "& .headroom": {
      zIndex: theme.zIndexes.searchResults,
      height: EA_FORUM_GIVING_SEASON_HEADER_HEIGHT,
      overflow: "hidden",
      [theme.breakpoints.down("sm")]: {
        height: `${HEADER_HEIGHT}px !important`,
      },
    },
  },
  rootScrolled: {
    "& $appBarGivingSeason": {
      boxShadow: `inset 0 0 0 1000px ${theme.palette.givingPortal.homepageHeader.dark}`,
    },
  },
  leftHeaderItems: {
    display: "flex",
    alignItems: "center",
  },
  homePageBackground: {
    background: theme.palette.givingPortal.homepageHeader.heartsBackground,
  },
  appBarGivingSeason: {
    color: theme.palette.givingPortal[1000],
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
      height: `${HEADER_HEIGHT}px !important`,
      color: theme.palette.givingPortal.homepageHeader.light2,
    },
    [theme.breakpoints.down("xs")]: {
      padding: "9px 11px",
    },
    "& .HeaderSubtitle-subtitle, & .SearchBar-searchIcon, & .ais-SearchBox-input, & .ais-SearchBox-input::placeholder, & .KarmaChangeNotifier-starIcon, & .KarmaChangeNotifier-gainedPoints, & .NotificationsMenuButton-badge, & .NotificationsMenuButton-buttonClosed, & .UsersMenu-arrowIcon": {
      color: theme.palette.givingPortal[1000],
      [theme.breakpoints.down("sm")]: {
        color: theme.palette.givingPortal.homepageHeader.light2,
      },
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
    justifyContent: "space-between",
  },
  siteLogoGivingSeason: {
    width: 34,
    [theme.breakpoints.down("sm")]: {
      width: 30,
      color: theme.palette.givingPortal.homepageHeader.light2,
    },
  },
  titleLinkGivingSeason: {
    color: theme.palette.givingPortal[1000],
    [theme.breakpoints.down("sm")]: {
      color: theme.palette.givingPortal.homepageHeader.light2,
    },
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
  gsRightHeaderItems: {
    position: "absolute",
    right: 0,
    top: 8,
    zIndex: 4,
    [theme.breakpoints.down("xs")]: {
      top: 4,
    }
  },
  gsContent: {
    marginTop: -20,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: "120%",
    letterSpacing: "-0.76px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "6px",
    height: "100%",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  gsContentTitle: {
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
  },
  gsContentSubtitle: {
    marginTop: -5,
    fontSize: 18,
    fontWeight: 500,
  },
  gsButtons: {
    display: "flex",
    gap: "10px",
    zIndex: 4,
    marginTop: 6,
    "& .EAButton-variantContained": {
      background: theme.palette.text.alwaysWhite,
      fontWeight: 600,
      height: 36,
    },
  },
  gsSecondaryButton: {
    fontFeatureSettings: "\"calt\"",
    backgroundColor: `${theme.palette.givingPortal.homepageHeader.secondaryButton} !important`,
    color: `${theme.palette.givingPortal.homepageHeader.secondaryButtonText} !important`,
    "&:hover": {
      opacity: 0.8,
    },
  },
  gsButtonIcon: {
    marginRight: 4,
    marginLeft: -4,
    width: 20,
    height: 20,
  },
  gsHearts: {
    position: "relative",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  gsHeart: {
    position: "absolute",
    zIndex: 3,
    color: theme.palette.givingPortal[1000],
    marginLeft: -12,
    marginTop: -12,
  },
  gsHeartTooltip: {
    backgroundColor: `${theme.palette.panelBackground.tooltipBackground2} !important`,
  },
  gsCanPlaceHeart: {
    cursor: "none",
  },
  gsHeartCursor: {
    pointerEvents: "none",
    color: theme.palette.givingPortal.homepageHeader.secondary,
  },
  gsLoadingHeart: {
    cursor: "wait !important",
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

const heartsQuery = gql`
  query GivingSeasonHeartsQuery($electionName: String!) {
    GivingSeasonHearts(electionName: $electionName) {
      userId
      displayName
      x
      y
      theta
    }
  }
`;

const addHeartMutation = gql`
  mutation AddGivingSeasonHeart(
    $electionName: String!,
    $x: Float!,
    $y: Float!,
    $theta: Float!
  ) {
    AddGivingSeasonHeart(
      electionName: $electionName,
      x: $x,
      y: $y,
      theta: $theta
    ) {
      userId
      displayName
      x
      y
      theta
    }
  }
`;

const removeHeartMutation = gql`
  mutation RemoveGivingSeasonHeart($electionName: String!) {
    RemoveGivingSeasonHeart(electionName: $electionName) {
      userId
      displayName
      x
      y
      theta
    }
  }
`;

const isValidTarget = (e: EventTarget): e is HTMLDivElement =>
  "tagName" in e && (e.tagName === "DIV" || e.tagName === "HEADER");

const MAX_THETA = 25;

const Heart: FC<{
  heart: GivingSeasonHeart,
  currentUser: UsersCurrent | null,
  removeHeart: () => Promise<void>,
  classes: ClassesType<typeof styles>,
}> = ({
  heart: {userId, displayName, x, y, theta},
  currentUser,
  removeHeart,
  classes,
}) => {
  const isCurrentUser = userId === currentUser?._id;
  const title = isCurrentUser
    ? "You added a heart (click to remove)"
    : `${displayName} added a heart`;
  const onClick = useCallback(() => {
    if (isCurrentUser) {
      void removeHeart();
    }
  }, [isCurrentUser, removeHeart]);
  const {LWTooltip, ForumIcon} = Components;
  return (
    <div
      style={{
        left: `${x * window.innerWidth}px`,
        top: `${y * EA_FORUM_GIVING_SEASON_HEADER_HEIGHT}px`,
        transform: `rotate(${theta}deg)`,
      }}
      className={classNames(classes.gsHeart, {
        [classes.gsHeartCursor]: !displayName,
      })}
    >
      <LWTooltip
        title={title}
        placement="bottom"
        popperClassName={classes.gsHeartTooltip}
      >
        <ForumIcon icon="Heart" onClick={onClick} />
      </LWTooltip>
    </div>
  );
}

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
  const {Typography, HeadTags, HeaderSubtitle, EAButton, CoreTagIcon} = Components;
  const isDesktop = useIsAboveBreakpoint("md");
  const { pathname, currentRoute } = useLocation();
  const { electionVote } = useElectionVote(eaGivingSeason23ElectionName);
  const currentUser = useCurrentUser();

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

  const {data, refetch} = useQuery(heartsQuery, {
    variables: {
      electionName: eaGivingSeason23ElectionName,
    },
    skip: !showHearts,
  });
  const [hearts, setHearts] = useState<GivingSeasonHeart[]>(data?.GivingSeasonHearts ?? []);

  useEffect(() => {
    setHearts(data?.GivingSeasonHearts ?? []);
  }, [data?.GivingSeasonHearts]);

  const [rawAddHeart, {loading: isAddingHeart}] = useMutation(
    addHeartMutation,
    {errorPolicy: "all"},
  );

  const [rawRemoveHeart, {loading: isRemovingHeart}] = useMutation(
    removeHeartMutation,
    {errorPolicy: "all"},
  );

  const headerRef = useRef<HTMLDivElement>(null);

  const normalizeCoords = useCallback((clientX: number, clientY: number) => {
    if (headerRef.current) {
      const bounds = headerRef.current.getBoundingClientRect();
      if (
        clientX > bounds.left &&
        clientX < bounds.right &&
        clientY > bounds.top &&
        clientY < bounds.bottom
      ) {
        return {
          x: clientX / bounds.width,
          y: clientY / bounds.height,
        };
      }
    }
    return null;
  }, [headerRef]);

  const addHeart = useCallback(async (x: number, y: number, theta: number) => {
    const result = await rawAddHeart({
      variables: {
        electionName: eaGivingSeason23ElectionName,
        x,
        y,
        theta,
      },
    });
    void refetch();
    return result;
  }, [rawAddHeart, refetch]);

  const removeHeart = useCallback(async () => {
    const result = await rawRemoveHeart({
      variables: {
        electionName: eaGivingSeason23ElectionName,
      },
    });
    const newHearts = result.data?.RemoveGivingSeasonHeart;
    if (Array.isArray(newHearts)) {
      setHearts(newHearts);
    }
    await refetch();
  }, [rawRemoveHeart, refetch]);

  const canAddHeart = !!currentUser && !isAddingHeart;
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);

  const onMouseMove = useCallback(({target, clientX, clientY}: MouseEvent) => {
    if (isValidTarget(target)) {
      setHoverPos(normalizeCoords(clientX, clientY));
    } else {
      setHoverPos(null);
    }
  }, [normalizeCoords]);

  const onMouseOut = useCallback(() => {
    setHoverPos(null);
  }, []);

  const onClick = useCallback(async ({target, clientX, clientY}: MouseEvent) => {
    if (isValidTarget(target)) {
      const coords = normalizeCoords(clientX, clientY);
      if (coords) {
        const theta = Math.round((Math.random() * MAX_THETA * 2) - MAX_THETA);
        const result = await addHeart(coords.x, coords.y, theta);
        const newHearts = result.data?.AddGivingSeasonHeart;
        if (Array.isArray(newHearts)) {
          setHearts(newHearts);
        }
        setHoverPos(null);
      }
    }
  }, [normalizeCoords, addHeart]);

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
        {...(canAddHeart ? {onMouseMove, onMouseOut, onClick} : {})}
        ref={headerRef}
        className={classNames(classes.root, classes.rootGivingSeason, {
          [classes.rootScrolled]: !unFixed,
          [classes.gsCanPlaceHeart]: hoverPos,
          [classes.gsLoadingHeart]: isAddingHeart || isRemovingHeart,
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
          <div className={classes.gsHearts}>
            <NoSSR>
              {hearts.map((heart) => (
                <Heart
                  key={heart.userId}
                  heart={heart}
                  currentUser={currentUser}
                  removeHeart={removeHeart}
                  classes={classes}
                />
              ))}
              {hoverPos &&
                <Heart
                  heart={{displayName: "", userId: "", theta: 0, ...hoverPos}}
                  currentUser={null}
                  removeHeart={removeHeart}
                  classes={classes}
                />
              }
            </NoSSR>
          </div>
          <header className={classNames(classes.appBarGivingSeason, classes.homePageBackground)}>
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
              <div className={classes.gsRightHeaderItems}>
                {rightHeaderItems}
              </div>
            </Toolbar>
            <div className={classes.gsContent}>
              <div className={classes.gsContentTitle}>
                <span>Get your <Link to="/posts/rszgfHdkmzCDDPM9k/where-are-you-donating-this-year-and-why-open-thread-1">2023 donations</Link> in</span>
              </div>
              <div className={classes.gsContentSubtitle}>
                {currentUser
                  ? (
                    <span>
                      Forum users who already donated: consider adding a heart
                      by clicking on this banner.
                    </span>
                  )
                  : (
                    <span>
                      Explore the funds below — or log in to add a heart if
                      you’ve already donated.
                    </span>
                  )
                }
              </div>
              <div className={classes.gsButtons}>
                <EAButton href="https://funds.effectivealtruism.org/funds/animal-welfare">
                  <CoreTagIcon tag={{slug: "animal-welfare"}} className={classes.gsButtonIcon} />{" "}
                  Animal Welfare Fund
                </EAButton>
                <EAButton href="https://funds.effectivealtruism.org/funds/far-future">
                  <CoreTagIcon tag={{slug: "ai-safety"}} className={classes.gsButtonIcon} />{" "}
                  Long-term Future Fund
                </EAButton>
                <EAButton href="https://funds.effectivealtruism.org/funds/global-development">
                  <CoreTagIcon tag={{slug: "global-health-and-development"}} className={classes.gsButtonIcon} />{" "}
                  Global Development Fund
                </EAButton>
                <EAButton href="https://funds.effectivealtruism.org/funds/ea-community">
                  <span className={classes.gsButtonIcon}>{lightbulbIcon}</span>{" "}
                  EA Infrastructure Fund
                </EAButton>
                <EAButton
                  href="/posts/bBm64htDSKn3ZKiQ5/meet-the-candidates-in-the-forum-s-donation-election-2023"
                  className={classes.gsSecondaryButton}
                >
                  -&gt; Explore more
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
