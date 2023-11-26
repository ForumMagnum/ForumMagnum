import React, { useCallback, useMemo, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useElectionCandidates } from "./hooks";
import { isElectionCandidateSort } from "../../../lib/collections/electionCandidates/views";
import type { SettingsOption } from "../../../lib/collections/posts/dropdownOptions";
import classNames from "classnames";
import Checkbox from "@material-ui/core/Checkbox";
import { requireCssVar } from "../../../themes/cssVars";
import difference from "lodash/difference";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "16px",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    rowGap: "12px",
    maxWidth: "100%",
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
  selectAll: {
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    color: theme.palette.givingPortal[1000],
    fontSize: 16,
  },
  checkbox: {
    padding: '4px 6px',
  }
});

const selectSortOptions: Record<Exclude<ElectionCandidatesSort, "mostPreVoted"> | "random", SettingsOption> = {
  random: {
    label: "Random (per user)",
  },
  name: {
    label: "Name A-Z",
  },
  recentlyAdded: {
    label: "Recently added",
  },
};

const sortOptions: Record<ElectionCandidatesSort | "random", SettingsOption> = {
  ...selectSortOptions,
  mostPreVoted: {
    label: "Most pre-voted",
  },
};

const ElectionCandidatesList = ({type="preVote", selectedCandidateIds, onSelect, setTotalCount, className, classes}: {
  /**
   * - "preVote": selecting a candidate (instantly) adds a pre-vote for it
   * - "select": selecting a candidate runs the onSelect callback
   */
  type?: "preVote" | "select",
  selectedCandidateIds?: string[],
  onSelect?: (candidateIds: string[]) => void,
  setTotalCount?: (count: number) => void,
  className?: string,
  classes: ClassesType,
}) => {
  const isSelect = type === "select";
  const [sortBy, setSortBy] = useState<ElectionCandidatesSort | "random">(
    isSelect ? "random" : "mostPreVoted"
  );
  const {results, loading} = useElectionCandidates(sortBy);

  const allSelected = useMemo(
    () => results?.every((candidate) => selectedCandidateIds?.includes(candidate._id)),
    [results, selectedCandidateIds]
  );

  if (setTotalCount) {
    setTotalCount(results?.length || 0);
  }

  const onSelectSort = useCallback((value: string) => {
    if (isElectionCandidateSort(value) || value === "random") {
      setSortBy(value);
    }
  }, []);

  const {Loading, ElectionCandidate, ForumDropdown} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.controls}>
        <ForumDropdown value={sortBy} options={isSelect ? selectSortOptions : sortOptions} onSelect={onSelectSort} className={classes.dropdown} />
        <div className={classes.selectAll}>
          <Checkbox
            className={classes.checkbox}
            style={{ color: requireCssVar("palette", "givingPortal", 1000) }}
            checked={allSelected}
            onChange={() => {
              const allIds = results?.map((candidate) => candidate._id) || [];
              const allUnselected = difference(allIds, selectedCandidateIds ?? []);

              if (allUnselected.length === 0) {
                // Clear selection
                onSelect?.(allIds)
              } else {
                onSelect?.(allUnselected)
              }
            }}
          />
          Select all
        </div>
      </div>
      <div className={classes.grid}>
        {loading && <Loading />}
        {results?.map((candidate) => (
          <ElectionCandidate
            type={type}
            selected={selectedCandidateIds?.includes(candidate._id)}
            onSelect={onSelect}
            candidate={candidate}
            key={candidate._id}
          />
        ))}
      </div>
    </div>
  );
}

const ElectionCandidatesListComponent = registerComponent(
  "ElectionCandidatesList",
  ElectionCandidatesList,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    ElectionCandidatesList: typeof ElectionCandidatesListComponent;
  }
}
