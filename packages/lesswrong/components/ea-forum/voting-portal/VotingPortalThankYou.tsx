import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { HEADER_HEIGHT } from "../../common/Header";
import { useWindowSize } from "../../hooks/useScreenWidth";
import ReactConfetti from "react-confetti";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useTracking } from "../../../lib/analyticsEvents";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "32px",
    color: theme.palette.givingPortal[1000],
    background: theme.palette.givingPortal.thankYouBackground,
    borderRadius: 12,
    padding: "48px 32px 24px 32px",
    width: 550,
    maxWidth: "100%",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
      borderRadius: 0,
      alignSelf: "flex-start",
    },
  },
  election: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "0.54px",
    textAlign: "center",
    padding: "0 24px",
  },
  thankYou: {
    fontSize: 50,
    fontWeight: 700,
    letterSpacing: "-1px",
    textAlign: "center",
  },
  horiz: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    padding: "24px 0",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      background: "inherit",
      gap: "16px",
    },
  },
  voted: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.14px",
    flexBasis: "50%",
    padding: "12px 28px",
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      maxWidth: 230,
    },
  },
  votedRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  icon: {
    color: theme.palette.givingPortal[1000],
    width: 20,
    height: 20,
  },
  arrowIcon: {
    fontSize: 18,
    transform: "rotate(180deg)",
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  tooltipRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  tooltip: {
    background: theme.palette.panelBackground.tooltipBackground2,
    color: theme.palette.text.alwaysWhite,
    borderRadius: theme.borderRadius.default,
    textAlign: "center",
    padding: "6px 10px",
    width: "16ch",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    marginRight: 20,
    flexBasis: "50%",
    gap: "8px",
    fontSize: 16,
    fontWeight: 600,
    background: theme.palette.givingPortal.button.dark,
    color: theme.palette.givingPortal.button.light,
    borderRadius: theme.borderRadius.small,
    padding: "12px 12px",
    border: "none",
    outline: "none",
    userSelect: "none",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.85,
    },
    "&:active": {
      opacity: 0.7,
    },
    [theme.breakpoints.down("xs")]: {
      marginRight: 0,
    },
  },
  hr: {
    borderTop: `1px solid ${theme.palette.givingPortal[1000]}`,
    opacity: 0.3,
  },
  list: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "24px",
    paddingLeft: 20,
    marginBottom: 0,
    "& li:not(:first-child)": {
      marginTop: 8,
    },
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
  },
  whiteButton: {
    background: theme.palette.grey[0],
    color: theme.palette.givingPortal[1000],
    border: theme.palette.border.grey200,
    borderRadius: theme.borderRadius.default,
    margin: "0 auto",
    width: "fit-content",
    padding: "12px 20px",
  },
});

const VotingPortalThankYou = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const [loadingFlair, setLoadingFlair] = useState(false);
  const {captureEvent} = useTracking();
  const {width, height} = useWindowSize();
  const [confetti, setConfetti] = useState(true);

  const onConfettiComplete = useCallback(() => {
    setConfetti(false);
  }, []);

  const toggleFlair = useCallback(async () => {
    setLoadingFlair(true);
    const newValue = !currentUser.givingSeason2023VotedFlair;
    await updateCurrentUser({
      givingSeason2023VotedFlair: newValue,
    });
    setLoadingFlair(false);
    captureEvent("setGivingSeasonVotedFlair", {value: newValue});
  }, [updateCurrentUser, currentUser.givingSeason2023VotedFlair, captureEvent]);

  const {ForumIcon, Loading} = Components;
  return (
    <div className={classes.root}>
      {confetti &&
        <ReactConfetti
          width={width}
          height={height}
          numberOfPieces={1200}
          tweenDuration={20000}
          colors={["#A82D22", "#9BBB99", "#FFAF58", "#FAA2A2", "#90CEE9"]}
          recycle={false}
          onConfettiComplete={onConfettiComplete}
        />
      }
      <div className={classes.election}>EA FORUM ELECTION 2023</div>
      <div className={classes.thankYou}>Thank you for voting!</div>
      <div className={classes.horiz}>
        <div className={classes.voted}>
          <div className={classes.votedRow}>
            {currentUser.displayName}
            <ForumIcon
              icon="Voted"
              className={classes.icon}
            />
          </div>
          <div className={classes.tooltipRow}>
            <div className={classes.tooltip}>
              I voted in the Donation Election
            </div>
          </div>
        </div>
        <div className={classes.button} role="button" onClick={toggleFlair}>
          {loadingFlair
            ? <Loading white />
            : <><ForumIcon icon="ArrowRight" className={classes.arrowIcon} /> {currentUser.givingSeason2023VotedFlair
              ? "Remove icon from your profile"
              : "Add icon to your profile"}</>
          }
        </div>
      </div>
      <div className={classes.hr} />
      <ul className={classes.list}>
        <li>
          <Link to="/posts/rszgfHdkmzCDDPM9k/where-are-you-donating-this-year-and-why-open-thread-1">
            Share that you voted or where you're donating
          </Link>
        </li>
        <li>
          {/* TODO get this from the election candidate */}
          <a href="https://www.givingwhatwecan.org/fundraisers/ea-forum-donation-election-fund-2023" target="_blank" rel="noopener noreferrer">
            Donate to the Donation Election Fund
          </a>
        </li>
        <li>
          <Link to="/giving-portal">
            Explore other giving opportunities
          </Link>
        </li>
      </ul>
      <Link to="/voting-portal/select-candidates" className={classNames(classes.button, classes.whiteButton)}>
        Edit your vote (until Dec 15)
      </Link>
    </div>
  );
}

const VotingPortalThankYouComponent = registerComponent(
  "VotingPortalThankYou",
  VotingPortalThankYou,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalThankYou: typeof VotingPortalThankYouComponent;
  }
}
