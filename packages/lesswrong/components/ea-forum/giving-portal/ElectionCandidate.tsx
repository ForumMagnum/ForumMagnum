import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { useVote } from "../../votes/withVote";
import { getVotingSystemByName } from "../../../lib/voting/votingSystems";
import classNames from "classnames";

const imageSize = 52;

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.givingPortal[500],
    borderRadius: theme.borderRadius.default,
    padding: 8,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.givingPortal[1000],
    display: "flex",
    gap: "16px",
    width: 360,
    maxWidth: "100%",
    minHeight: 68,
  },
  rootVoted: {
    backgroundColor: theme.palette.givingPortal[0],
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
  heartIcon: {
    fontSize: 14,
    transform: "translateY(2px)",
    marginRight: 4,
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
    opacity: 0.8,
    fontWeight: 500,
    fontSize: 14,
    letterSpacing: "-0.14px",
  },
  postCount: {
    textDecoration: "none",
    "&:hover": {
      opacity: 1,
      textDecoration: "underline",
    },
  },
});

const ElectionCandidate = ({candidate, classes}: {
  candidate: ElectionCandidateBasicInfo,
  classes: ClassesType,
}) => {
  const votingProps = useVote(
    candidate,
    "ElectionCandidates",
    getVotingSystemByName("eaDonationElection"),
  );

  const {
    name, logoSrc, href, postCount, extendedScore, currentUserExtendedVote,
  } = votingProps.document;
  const preVoteCount = extendedScore?.preVoteCount ?? 0;
  const hasVoted = !!currentUserExtendedVote?.preVote;

  const {PreVoteButton, ForumIcon} = Components;
  return (
    <div className={classNames(classes.root, {
      [classes.rootVoted]: hasVoted,
    })}>
      <div className={classes.imageContainer}>
        <Link to={href}>
          <img src={logoSrc} className={classes.image} />
        </Link>
      </div>
      <div className={classes.details}>
        <PreVoteButton {...votingProps} className={classes.preVoteButton} />
        <div className={classes.name}>
          <Link to={href}>
            {name}
          </Link>
        </div>
        <div className={classes.preVotes}>
          <ForumIcon icon="HeartOutline" className={classes.heartIcon} />
          {preVoteCount} pre-vote{preVoteCount === 1 ? "" : "s"}
          ,{" "}
          <a href="#" className={classes.postCount}>
            {postCount} post{postCount === 1 ? "" : "s"}
          </a>
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
