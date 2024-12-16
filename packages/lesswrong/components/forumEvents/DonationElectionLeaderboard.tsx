import React, { useMemo, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { IRPossibleVoteCounts } from "@/lib/givingSeason/instantRunoff";
import { ACTIVE_DONATION_ELECTION, DONATION_ELECTION_NUM_WINNERS } from "@/lib/givingSeason";
import { useMulti } from "@/lib/crud/withMulti";
import classNames from "classnames";
import { Link } from "@/lib/reactRouterWrapper";
import { GIVING_SEASON_MD_WIDTH } from "./useGivingSeasonEvents";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    maxWidth: 750,
    marginBottom: 16
  },
  header: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: 600
  },
  candidateWrapper: {
    display: "flex",
    gap: "12px"
  },
  candidateImage: {
    width: '36px',
    height: '36px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: theme.borderRadius.small
  },
  result: {
    width: "100%"
  },
  candidateDetails: {
    display: "flex",
    justifyContent: "space-between"
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    maxWidth: 350,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    '&:hover': {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
    [theme.breakpoints.down(GIVING_SEASON_MD_WIDTH)]: {
      maxWidth: 260,
    },
  },
  voteCount: {
    fontWeight: 500,
    color: theme.palette.text.alwaysWhite,
    opacity: 0.8
  },
  barContainer: {
    position: 'relative',
    height: '12px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  barFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: theme.palette.text.alwaysWhite,
    opacity: 0.5,
    transition: 'width 0.3s ease',
    borderRadius: '2px',
  },
  showMoreRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  showMoreButton: {
    cursor: "pointer",
    fontWeight: 600,
  },
  showMoreInfo: {
    color: theme.palette.text.alwaysWhite,
    opacity: 0.7,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down(GIVING_SEASON_MD_WIDTH)]: {
      display: "none"
    },
  },
  infoCircle: {
    width: 20,
    height: 20,
    marginTop: 4,
    marginLeft: 4,
    cursor: "pointer",
    '&:hover': {
      color: theme.palette.text.alwaysWhite,
    }
  },
  infoTooltipPopper: {
    background: `${theme.palette.text.alwaysBlack} !important`,
    textAlign: "center",
  },
  infoTooltip: {
    maxWidth: 400,
    '& a': {
      textDecoration: "underline",
      textUnderlineOffset: "2px",
      '&:hover': {
        textDecoration: "underline",
        textUnderlineOffset: "2px",
        opacity: 0.8
      }
    }
  }
});

export const DonationElectionLeaderboard = ({
  voteCounts,
  hideHeader,
  className,
  classes,
}: {
  voteCounts: IRPossibleVoteCounts;
  hideHeader?: boolean;
  className?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const { LWTooltip, ForumIcon } = Components;

  const [winnerCount, setVisibleCount] = useState(DONATION_ELECTION_NUM_WINNERS);

  const { results } = useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {
      electionName: ACTIVE_DONATION_ELECTION
    },
    limit: 100,
  });
  const candidates = useMemo(() => results ?? [], [results]);

  const handleShowMore = () => {
    if (voteCounts[winnerCount + 1]) {
      setVisibleCount(winnerCount + 1);
    }
  };

  // Get the leaderboard showing `winnerCount` winners, or fallback to the next highest number of winners available
  const voteCount = useMemo(
    () =>
      voteCounts[
        Math.max(
          ...Object.keys(voteCounts)
            .map(Number)
            .filter((key) => key <= winnerCount)
        )
      ] ?? {},
    [voteCounts, winnerCount]
  );

  const sortedCharityIds = useMemo(() => Object.entries(voteCount).sort(
    (a, b) => b[1] - a[1]
  ), [voteCount]);

  const sortedCharities = useMemo(() => 
    sortedCharityIds.map(([id, count]) => {
      const candidate = candidates.find(candidate => candidate._id === id);
      return { candidate, count };
    }),
    [sortedCharityIds, candidates]
  );

  const maxVotes = sortedCharityIds[0][1];

  const electionIsOver = true;

  return (
    <div className={classNames(classes.root, className)}>
      {!hideHeader &&
        <div className={classes.header}>
          {electionIsOver ? "Winners" : "Current Leaderboard"}
        </div>
      }
      {sortedCharities.map(({ count, candidate }, index) => (
        <div key={candidate?._id ?? index} className={classes.candidateWrapper}>
          <div
            style={{ backgroundImage: candidate?.logoSrc ? `url(${candidate.logoSrc})` : "none" }}
            className={classes.candidateImage}
          />
          <div className={classes.result}>
            <div className={classes.candidateDetails}>
              {candidate ? (
                <Link to={candidate?.href} className={classes.candidateName}>
                  {candidate?.name}
                </Link>
              ) : (
                <div>—</div>
              )}
              <div className={classes.voteCount}>{count}</div>
            </div>
            <div className={classes.barContainer}>
              <div className={classes.barFill} style={{ width: `${(count / maxVotes) * 100}%` }}></div>
            </div>
          </div>
        </div>
      ))}
      {!electionIsOver && voteCounts[winnerCount + 1] && (
        <div className={classes.showMoreRow}>
          <div className={classes.showMoreButton} onClick={handleShowMore}>
            + Show one more
          </div>
          <div className={classes.showMoreInfo}>
            <span>This will recalculate the vote totals</span>
            <LWTooltip
              title={
                <>
                  To get down to 3 winners, candidates are eliminated one by one and votes are reallocated according to{" "}
                  <Link to="/posts/j6fmnYM5ZRu9fJyrq/donation-election-how-to-vote" target="_blank" rel="noopener noreferrer">instant-runoff rules</Link>.
                  Clicking "show one more" here un-eliminates the next best candidate, which results in votes being
                  removed from higher scoring candidates and allocated back to this one. This is intended for
                  illustration/tactical voting purposes.{" "}
                  <Link to="/posts/j6fmnYM5ZRu9fJyrq/donation-election-how-to-vote" target="_blank" rel="noopener noreferrer">Learn more here</Link>.
                </>
              }
              popperClassName={classes.infoTooltipPopper}
              titleClassName={classes.infoTooltip}
              placement="top"
              clickable
            >
              <ForumIcon
                icon="InfoCircle"
                className={classes.infoCircle}
              />
            </LWTooltip>
          </div>
        </div>
      )}
    </div>
  );
};

const DonationElectionLeaderboardComponent = registerComponent(
  "DonationElectionLeaderboard",
  DonationElectionLeaderboard,
  { styles }
);

declare global {
  interface ComponentTypes {
    DonationElectionLeaderboard: typeof DonationElectionLeaderboardComponent;
  }
}
