import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import type { GivingPortalOrg } from "./givingPortalOrgs";

const imageSize = 52;

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    backgroundColor: theme.palette.givingPortal.secondary,
    borderRadius: theme.borderRadius.default,
    padding: 8,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[0],
    display: "flex",
    gap: "16px",
    width: 360,
    height: 68,
    border: "1px solid transparent",
    "&:hover": {
      opacity: 0.9,
      border: `1px solid ${theme.palette.givingPortal.dark}`,
    },
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
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "2px",
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

const ElectionCandidate = ({org, classes}: {
  org: GivingPortalOrg,
  classes: ClassesType,
}) => {
  const {name, logoSrc, href, preVoteCount} = org;
  return (
    <Link to={href} className={classes.root}>
      <div className={classes.imageContainer}>
        <img src={logoSrc} className={classes.image} />
      </div>
      <div className={classes.details}>
        <div className={classes.name}>
          {name}
        </div>
        <div className={classes.preVotes}>
          {preVoteCount} pre-vote{preVoteCount === 1 ? "" : "s"}
        </div>
      </div>
    </Link>
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
