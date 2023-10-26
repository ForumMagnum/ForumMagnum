import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";

const imageSize = 52;

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.givingPortal[800],
    borderRadius: theme.borderRadius.default,
    padding: 8,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[0],
    display: "flex",
    gap: "16px",
    width: 360,
    height: 68,
  },
  imageContainer: {
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.palette.grey[0],
    width: imageSize,
    height: imageSize,
  },
  image: {
    borderRadius: theme.borderRadius.small,
    objectFit: "cover",
    width: imageSize,
    height: imageSize,
  },
  details: {
    position: "relative",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "2px",
  },
  preVoteButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  name: {
    fontWeight: 600,
    fontSize: 16,
    letterSpacing: "-0.16px",
  },
  preVotes: {
    opacity: 0.5,
    fontWeight: 500,
    fontSize: 14,
    letterSpacing: "-0.14px",
  },
});

const ElectionCandidate = ({candidate, classes}: {
  candidate: ElectionCandidateBasicInfo,
  classes: ClassesType,
}) => {
  const {name, logoSrc, href, baseScore} = candidate;
  const {PreVoteButton} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.imageContainer}>
        <img src={logoSrc} className={classes.image} />
      </div>
      <div className={classes.details}>
        <PreVoteButton className={classes.preVoteButton} />
        <div className={classes.name}>
          <Link to={href}>
            {name}
          </Link>
        </div>
        <div className={classes.preVotes}>
          {baseScore} pre-vote{baseScore === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}

const ElectionCandidateComponent = registerComponent(
  "ElectionCandidate",
  ElectionCandidate,
  {styles},
);

declare global {
  interface ComponentTypes {
    ElectionCandidate: typeof ElectionCandidateComponent;
  }
}
