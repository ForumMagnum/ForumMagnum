import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { HEADER_HEIGHT } from "../../common/Header";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "32px",
    color: theme.palette.givingPortal[1000],
    background: theme.palette.givingPortal[200],
    borderRadius: 12,
    padding: "48px 32px",
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
    gap: "16px",
    padding: "24px 0",
    "& > *": {
      flexBasis: "50%",
    },
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
    },
  },
  voted: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: theme.palette.grey[0],
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.14px",
    padding: "12px 24px",
    borderRadius: theme.borderRadius.default,
  },
  votedRow: {
    display: "flex",
    gap: "8px",
  },
  icon: {
    color: theme.palette.givingPortal[1000],
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
    gap: "10px",
    fontSize: 16,
    fontWeight: 600,
    background: theme.palette.givingPortal.button.dark,
    color: theme.palette.givingPortal.button.light,
    borderRadius: theme.borderRadius.small,
    padding: "12px 20px",
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
});

const VotingPortalThankYou = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.election}>EA FORUM ELECTION 2023</div>
      <div className={classes.thankYou}>Thank you for voting!</div>
      <div className={classes.horiz}>
        <div className={classes.voted}>
          <div className={classes.votedRow}>
            {currentUser.displayName}
            <ForumIcon
              icon="ChatBubbleLeftRightFilled"
              className={classes.icon}
            />
          </div>
          <div className={classes.tooltipRow}>
            <div className={classes.tooltip}>
              I voted in the Donation Election
            </div>
          </div>
        </div>
        <div>
          <div className={classes.button}>Add icon to your profile</div>
        </div>
      </div>
      <div className={classes.hr} />
      <ul className={classes.list}>
        <li>
          <Link to="#">
            Share that you voted and why you voted the way you did
          </Link>
        </li>
        <li>
          <Link to="#">
            Add to the Donation Election Fund
          </Link>
        </li>
        <li>
          <Link to="#">
            Explore other giving opportunities
          </Link>
        </li>
      </ul>
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
