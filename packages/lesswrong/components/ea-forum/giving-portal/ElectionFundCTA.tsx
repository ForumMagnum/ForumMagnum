import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.givingPortal[0],
    color: theme.palette.grey[1000],
    borderRadius: theme.borderRadius.default,
    width: 500,
    padding: "32px 24px",
  },
  h1: {
    fontSize: 28,
    letterSpacing: "-0.28px",
    fontWeight: 700,
  },
  h2: {
    fontSize: 20,
    letterSpacing: "-0.20px",
    fontWeight: 700,
  },
  h3: {
    fontSize: 16,
    letterSpacing: "-0.16px",
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  progressBar: {
    position: "relative",
    width: "100%",
    height: 28,
    backgroundColor: theme.palette.givingPortal[200],
    borderRadius: theme.borderRadius.small,
  },
  progress: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: theme.palette.givingPortal[1000],
    borderRadius: theme.borderRadius.small,
    height: "100%",
  },
  donateButton: {
    width: "100%",
    fontSize: 18,
    fontWeight: 600,
    color: theme.palette.grey[0],
    backgroundColor: theme.palette.givingPortal[1000],
    borderRadius: theme.borderRadius.small,
    padding: 16,
    border: "none",
    outline: "none",
    "&:hover": {
      opacity: 0.9,
    },
    "&:active": {
      opacity: 0.8,
    },
  },
});

const ElectionFundCTA = ({
  amountRaised,
  donationTarget,
  votingOpensDate,
  onDonate,
  classes,
}: {
  amountRaised: number,
  donationTarget: number,
  votingOpensDate: Date,
  onDonate: () => void,
  classes: ClassesType,
}) => {
  const now = moment(new Date())
  const daysUntilVotingOpens = moment(votingOpensDate).diff(now, "days");
  const targetPercent = (amountRaised / donationTarget) * 100;
  return (
    <div className={classes.root}>
      <div className={classes.h1}>Donate to the Election Fund</div>
      <img src="/electionFundCta.jpg" />
      <div className={classes.progressBar}>
        <div
          className={classes.progress}
          style={{width: `${targetPercent}%`}}
        />
      </div>
      <div className={classes.row}>
        <div className={classes.h2}>
          ${amountRaised} raised so far
        </div>
        <div className={classes.h3}>
          Voting opens in {daysUntilVotingOpens} days
        </div>
      </div>
      <button onClick={onDonate} className={classes.donateButton}>
        Donate
      </button>
    </div>
  );
}

const ElectionFundCTAComponent = registerComponent(
  "ElectionFundCTA",
  ElectionFundCTA,
  {styles},
);

declare global {
  interface ComponentTypes {
    ElectionFundCTA: typeof ElectionFundCTAComponent;
  }
}
