import React, { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useElectionCandidates } from "../giving-portal/hooks";
import { isElectionCandidateSort } from "../../../lib/collections/electionCandidates/views";
import classNames from "classnames";
import { sortOptions } from "../giving-portal/ElectionCandidatesList";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { imageSize } from "../giving-portal/ElectionCandidate";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import { numberToEditableString } from "../../../lib/collections/electionVotes/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "16px",
  },
  table: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  dropdown: {
    "& .ForumDropdownMultiselect-button": {
      color: theme.palette.givingPortal[1000],
      fontSize: 16,
      "&:hover": {
        backgroundColor: theme.palette.givingPortal.candidate,
      },
    },
  },
  hr: {
    width: "100%",
    height: 1,
    backgroundColor: theme.palette.grey[600],
    opacity: 0.2,
    border: "none",
    margin: 0,
  },
  allocateVoteRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: 12,
    justifyContent: "space-between",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      padding: '16px 8px'
    },
  },
  details: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
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
    fontWeight: 600,
    fontSize: 18,
    color: theme.palette.givingPortal[1000],
  },
  allocateInput: {
    width: 150,
    height: 48,
    "& input": {
      textAlign: "right",
      fontSize: 18,
      fontWeight: 500,
      color: theme.palette.grey[1000],
      zIndex: theme.zIndexes.singleColumnSection
    },
    "& .MuiNotchedOutline-focused": {
      border: `2px solid ${theme.palette.givingPortal[1000]} !important`
    },
    "& .MuiNotchedOutline-root": {
      backgroundColor: theme.palette.grey[100],
      border: "none"
    },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
});

const AllocateVoteRow = ({
  candidate,
  voteState,
  setVoteState,
  classes,
}: {
  candidate: ElectionCandidateBasicInfo;
  voteState: Record<string, number | string | null>;
  setVoteState: Dispatch<SetStateAction<Record<string, number | string | null>>>;
  classes: ClassesType<typeof styles>;
}) => {
  const { _id: candidateId, name, logoSrc, fundraiserLink } = candidate;
  const naiveValue = voteState[candidateId];
  const formattedValue =
    typeof naiveValue === "number"
      ? numberToEditableString(naiveValue, 15)
      : voteState[candidateId] ?? "";

  return (
    <AnalyticsContext pageElementContext="allocateVoteRow">
      <div className={classes.allocateVoteRow}>
        <div className={classes.details}>
          <div className={classes.imageContainer}>
            <Link to={fundraiserLink || ""}>
              <img src={logoSrc} className={classes.image} />
            </Link>
          </div>
          <div className={classes.candidateName}>{name}</div>
        </div>
        <OutlinedInput
          className={classes.allocateInput}
          labelWidth={0}
          value={formattedValue}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || value === null) {
              setVoteState((prev) => ({ ...prev, [candidateId]: null } as Record<string, number | string | null>));
            } else if (/^\d*\.?\d*$/.test(value) && value.length < 15) { // Only allow positive (decimal) numbers up to 15 characters
              setVoteState((prev) => ({ ...prev, [candidateId]: value } as Record<string, number | string | null>));
            }
          }}
          type="string"
        />
      </div>
    </AnalyticsContext>
  );
};

const ElectionAllocateVote = ({
  voteState,
  setVoteState,
  className,
  classes,
}: {
  voteState: Record<string, number | string | null>;
  setVoteState: Dispatch<SetStateAction<Record<string, number | string | null>>>;
  className?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const [sortBy, setSortBy] = useState<ElectionCandidatesSort | "random">("random");
  const { results, loading } = useElectionCandidates(sortBy);

  const selectedResults = results?.filter((candidate) => voteState[candidate._id] !== undefined);

  const onSelectSort = useCallback((value: string) => {
    if (isElectionCandidateSort(value) || value === "random") {
      setSortBy(value);
    }
  }, []);

  const { Loading, ForumDropdown } = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.controls}>
        <ForumDropdown value={sortBy} options={sortOptions} onSelect={onSelectSort} className={classes.dropdown} />
      </div>
      <div className={classes.table}>
        {loading && <Loading />}
        {selectedResults?.map((candidate, index) => (
          <React.Fragment key={candidate._id}>
            <AllocateVoteRow
              candidate={candidate}
              voteState={voteState}
              setVoteState={setVoteState}
              classes={classes}
            />
            {index < selectedResults.length - 1 && <hr className={classes.hr} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const ElectionAllocateVoteComponent = registerComponent("ElectionAllocateVote", ElectionAllocateVote, {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    ElectionAllocateVote: typeof ElectionAllocateVoteComponent;
  }
}
