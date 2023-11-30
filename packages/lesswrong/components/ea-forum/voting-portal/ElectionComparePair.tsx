import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { imageSize } from "../giving-portal/ElectionCandidate";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import { numberToEditableString } from "../../../lib/collections/electionVotes/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
  },
  compareInput: {
    width: 90,
    height: 48,
    margin: "0 6px 0 0",
    "& input": {
      textAlign: "right",
      fontSize: 16,
      fontWeight: 500,
      color: theme.palette.grey[1000],
      zIndex: theme.zIndexes.singleColumnSection
    },
    "& .MuiNotchedOutline-focused": {
      border: `2px solid ${theme.palette.givingPortal[1000]} !important`,
    },
    "& .MuiNotchedOutline-root": {
      backgroundColor: theme.palette.background.contrastInDarkMode,
    },
  },
  candidateDetails: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    padding: 6,
    gap: "8px",
    backgroundColor: theme.palette.givingPortal.candidate,
    borderRadius: theme.borderRadius.default,
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
  candidateName: {
    color: theme.palette.givingPortal[1000],
    fontSize: 16,
    fontWeight: 600,
  },
  switchOrderButton: {
    gap: "6px",
    display: "flex",
    fontSize: 14,
    color: theme.palette.givingPortal[1000],
    cursor: "pointer",
    userSelect: "none",
    fontWeight: 600,
    "&:hover": {
      opacity: 0.8,
    },
  },
  switchOrderIcon: {
    fontSize: 18,
  },
});

const CandidateDetails = ({
  candidate,
  classes,
}: {
  candidate: ElectionCandidateBasicInfo;
  classes: ClassesType<typeof styles>;
}) => {
  const { name, logoSrc, fundraiserLink } = candidate;

  return (
    <div className={classes.candidateDetails}>
      <div className={classes.imageContainer}>
        <Link to={fundraiserLink || ""} target="_blank" rel="noopener noreferrer">
          <img src={logoSrc} className={classes.image} />
        </Link>
      </div>
      {/* TODO tooltip */}
      <Link to={fundraiserLink || ""} target="_blank" rel="noopener noreferrer" className={classes.candidateName}>
        {name}
      </Link>
    </div>
  );
}

const ElectionComparePair = ({
  candidateA,
  candidateB,
  value,
  setValue,
  classes,
}: {
  candidateA: ElectionCandidateBasicInfo;
  candidateB: ElectionCandidateBasicInfo;
  value: {multiplier: number | string, AtoB: boolean};
  setValue: (newState: {multiplier: number | string, AtoB: boolean}) => void;
  classes: ClassesType<typeof styles>;
}) => {
  const firstCandidate = value.AtoB ? candidateA : candidateB;
  const secondCandidate = value.AtoB ? candidateB : candidateA;

  // If multiplier is a number, convert it to a string NOT using scientific notation
  const multiplierString =
    typeof value.multiplier === "string" ? value.multiplier : numberToEditableString(value.multiplier)

  const { ForumIcon } = Components;
  return (
    <div className={classes.root}>
      <div>We should give</div>
      <CandidateDetails candidate={firstCandidate} classes={classes} />
      <div>
        <OutlinedInput
          className={classes.compareInput}
          labelWidth={0}
          value={multiplierString}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue === "" || newValue === null) {
              setValue({ multiplier: "", AtoB: value.AtoB });
            } else if (/^\d*\.?\d*$/.test(newValue) && newValue.length < 10) {
              // Only allow (decimal) numbers, and up to 10 characters. To handle typing, we do allow 0 to be
              // entered, but it will throw an error on submit
              setValue({ multiplier: newValue, AtoB: value.AtoB });
            }
          }}
          type="string"
        />
        times as much money as
      </div>
      <CandidateDetails candidate={secondCandidate} classes={classes} />
      <div
        className={classes.switchOrderButton}
        onClick={() => {
          const invertedMultiplier = value.multiplier
            ? // Invert, truncate to 5 significant figures, and then remove trailing zeros by doing parseFloat again
              parseFloat((1 / parseFloat(value.multiplier as string)).toPrecision(5)).toString()
            : "";
          setValue({ multiplier: invertedMultiplier, AtoB: !value.AtoB })
        }}
      >
        <ForumIcon icon="ArrowCircle" className={classes.switchOrderIcon} /> Switch order
      </div>
    </div>
  );
};

const ElectionComparePairComponent = registerComponent("ElectionComparePair", ElectionComparePair, {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    ElectionComparePair: typeof ElectionComparePairComponent;
  }
}
