import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { HEADER_HEIGHT } from "../../common/Header";
import { Link } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    margin: "80px 0",
    display: "flex",
    flexDirection: "column",
    gap: "40px",
    borderRadius: 12,
    background: theme.palette.grey[0],
    padding: 40,
    width: 730,
    maxWidth: "100%",
    lineHeight: "24px",
    fontSize: 16,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
      borderRadius: 0,
      alignSelf: "flex-start",
    },
  },
  description: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  bold: {
    fontWeight: 700,
  },
  inset: {
    borderRadius: theme.borderRadius.default,
    background: theme.palette.grey[100],
    padding: 32,
  },
  h1: {
    color: theme.palette.givingPortal[1000],
    fontSize: 40,
    fontWeight: 700,
  },
  h2: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 32,
  },
  h3: {
    fontSize: 18,
    fontWeight: 700,
    marginTop: 24,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
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
    textDecoration: "none !important",
    "&:hover": {
      opacity: "0.85 !important",
    },
    "&:active": {
      opacity: "0.7 !important",
    },
  },
});

const fundLink = "https://www.givingwhatwecan.org/fundraisers/ea-forum-donation-election-fund-2023";
const exploreLink = "/giving-portal";
const processLink = "/posts/dYhKfsNuQX2sznfxe/donation-election-how-voting-will-work";
const getStartedLink = "#"; // TODO

const VotingPortalIntro = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.h1}>Welcome to the voting portal</div>
      <div className={classes.description}>
        <div>
          The <Link to={fundLink}>Donation Election Fund</Link> will be designated
          for the top 3 winners, in proportion to the election results.{" "}
          <span className={classes.bold}>
            Your vote should represent how you’d allocate funding between the
            candidates.
          </span>{" "}
          <Link to={exploreLink}>Explore the candidates</Link> before you vote.
        </div>
        <div>
          Your vote is anonymous. You won’t be able to change your vote after
          submitting it. When votes are in, we’ll use{" "}
          <Link to={processLink} className={classes.bold}>the process outlined here</Link>{" "}
          to determine the election results.
        </div>
      </div>
      <div className={classes.inset}>
        <div className={classes.h2}>How voting works</div>
        <div className={classes.h3}>
          1. Select candidates you want to vote for
        </div>
        <div>
          These are the candidates you’ll allocate points to; you’ll give 0
          points to the ones you don’t select.
        </div>
        <div className={classes.h3}>
          2. Compare candidates using a tool
        </div>
        <div>
          The tool will prompt you to compare pairs of candidates and share how
          much more funding you’d give to one candidate than the other. You can
          skip this step if you want to.
        </div>
        <div className={classes.h3}>
          3. Allocate your points
        </div>
        <div>
          Finalize your point allocation, which should represent how you’d
          distribute funding between the candidates if it were up to you.
        </div>
        <div className={classes.h3}>
          4. Submit your votes
        </div>
        <div>
          Share a note if you want to, and submit your vote!
        </div>
      </div>
      <Link to={getStartedLink} className={classes.button}>
        Get started -&gt;
      </Link>
    </div>
  );
}

const VotingPortalIntroComponent = registerComponent(
  "VotingPortalIntro",
  VotingPortalIntro,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalIntro: typeof VotingPortalIntroComponent;
  }
}
