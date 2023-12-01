import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useElectionCandidates } from "../giving-portal/hooks";
import classNames from "classnames";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { imageSize } from "../giving-portal/ElectionCandidate";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import { numberToEditableString } from "../../../lib/collections/electionVotes/helpers";
import { votingPortalStyles } from "./styles";
import stringify from "json-stringify-deterministic";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  table: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    marginBottom: 16,
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
  descriptionTooltip: {
    maxWidth: 320,
    marginTop: 8,
    textAlign: "left",
    borderRadius: `${theme.borderRadius.default}px !important`,
    backgroundColor: `${theme.palette.grey[900]} !important`,
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 12, // Just stop it from really overflowing
  },
  candidateName: {
    fontWeight: 600,
    fontSize: 18,
    color: theme.palette.givingPortal[1000],
    '&:hover': {
      textUnderlineOffset: '3px',
      textDecoration: 'underline',
    }
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
  controls: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
    height: 22, // Fixed height because the sort button may or may not be there
    [theme.breakpoints.down("xs")]: {
      marginBottom: 6,
    },
  },
  sort: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 600,
    color: theme.palette.givingPortal[1000],
    fontSize: 16,
    marginRight: 18,
    padding: 0,
    backgroundColor: "inherit",
    display: "flex",
    alignItems: "center",
  },
  sortIcon: {
    width: 22,
    height: 22,
    position: "relative",
    top: 2,
    marginRight: 2,
  },
  hidden: {
    display: "none",
  },
  normalizedWarning: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: 500,
    margin: '2px 0'
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
  const { LWTooltip } = Components;

  const { _id: candidateId, name, logoSrc, href, description } = candidate;
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
            <Link to={href || ""} target="_blank" rel="noopener noreferrer">
              <img src={logoSrc} className={classes.image} />
            </Link>
          </div>
          <LWTooltip title={description} placement="bottom" popperClassName={classes.descriptionTooltip}>
            <Link to={href || ""} className={classes.candidateName} target="_blank" rel="noopener noreferrer">
              {name}
            </Link>
          </LWTooltip>
        </div>
        <OutlinedInput
          className={classes.allocateInput}
          labelWidth={0}
          value={formattedValue}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || value === null) {
              setVoteState((prev) => ({ ...prev, [candidateId]: null } as Record<string, number | string | null>));
            } else if (/^\d*\.?\d*$/.test(value) && value.length < 15) {
              // Only allow positive (decimal) numbers up to 15 characters
              setVoteState((prev) => ({ ...prev, [candidateId]: value } as Record<string, number | string | null>));
            }
          }}
          type="string"
        />
      </div>
    </AnalyticsContext>
  );
};

const sortBy = "random";

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
  const { results, loading } = useElectionCandidates(sortBy);
  const [displayedResults, setDisplayedResults] = useState<ElectionCandidateBasicInfo[]>([]);

  const selectedResults = useMemo(
    () => results?.filter((candidate) => voteState[candidate._id] !== undefined),
    [results, voteState]
  );
  const sortedResults = useMemo(
    () =>
      selectedResults?.slice().sort((a, b) => {
        const numericalVoteState = Object.fromEntries(
          // Treate 0, "0", null etc all as null
          Object.entries(voteState).map(([id, value]) => [id, value ? parseFloat(value as string) : null])
        );

        const aValue = numericalVoteState[a._id] ?? 0;
        const bValue = numericalVoteState[b._id] ?? 0;

        return bValue - aValue;
      }),
    [selectedResults, voteState]
  );
  const canUpdateSort = useMemo(
    () =>
      displayedResults?.length &&
      stringify(sortedResults?.map((r) => r._id)) !== stringify(displayedResults?.map((r) => r._id)),
    [sortedResults, displayedResults]
  );

  const updateSort = useCallback(() => {
    if (!sortedResults) return;

    setDisplayedResults(sortedResults);
  }, [sortedResults]);

  useEffect(() => {
    if (!displayedResults.length && sortedResults?.length) {
      updateSort();
    }
  }, [displayedResults, sortedResults, updateSort]);

  const { Loading, ForumIcon } = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.controls}>
        <button
          className={classNames(classes.sort, {
            [classes.hidden]: !canUpdateSort,
          })}
          disabled={!canUpdateSort}
          onClick={updateSort}
        >
          <ForumIcon icon="BarsArrowDown" className={classes.sortIcon} /> Sort descending
        </button>
      </div>
      <div className={classes.normalizedWarning}>
        Don't worry about the total point score; points will be normalized.
      </div>
      <div className={classes.table}>
        {loading && <Loading />}
        {displayedResults?.map((candidate, index) => (
          <React.Fragment key={candidate._id}>
            <AllocateVoteRow
              candidate={candidate}
              voteState={voteState}
              setVoteState={setVoteState}
              classes={classes}
            />
            {index < displayedResults.length - 1 && <hr className={classes.hr} />}
          </React.Fragment>
        ))}
      </div>
      {displayedResults.length > 10 && <div className={classes.controls}>
        <button
          className={classNames(classes.sort, {
            [classes.hidden]: !canUpdateSort,
          })}
          disabled={!canUpdateSort}
          onClick={updateSort}
        >
          <ForumIcon icon="BarsArrowDown" className={classes.sortIcon} /> Sort descending
        </button>
      </div>}
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
