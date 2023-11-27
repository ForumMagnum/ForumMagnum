import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useElectionCandidates } from "./hooks";
import { isElectionCandidateSort } from "../../../lib/collections/electionCandidates/views";
import type { SettingsOption } from "../../../lib/collections/posts/dropdownOptions";
import classNames from "classnames";

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
  dropdown: {

    "& .ForumDropdownMultiselect-button": {
      color: theme.palette.givingPortal[1000],
      fontSize: 16,
      "&:hover": {
        backgroundColor: theme.palette.givingPortal.candidate,
      },
    },
  },
});

const sortOptions: Record<ElectionCandidatesSort, SettingsOption> = {
  mostPreVoted: {
    label: "Most pre-voted",
  },
  name: {
    label: "Name A-Z",
  },
  recentlyAdded: {
    label: "Recently added",
  },
};

const ElectionCandidatesList = ({className, classes}: {
  className?: string,
  classes: ClassesType,
}) => {
  const [sortBy, setSortBy] = useState<ElectionCandidatesSort>("mostPreVoted");
  const {results, loading} = useElectionCandidates(sortBy);

  const onSelectSort = useCallback((value: string) => {
    if (isElectionCandidateSort(value)) {
      setSortBy(value);
    }
  }, []);

  const {Loading, ElectionCandidate, ForumDropdown} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <ForumDropdown
        value={sortBy}
        options={sortOptions}
        onSelect={onSelectSort}
        className={classes.dropdown}
      />
      <div className={classes.grid}>
        {loading && <Loading white />}
        {results?.map((candidate) => (
          <ElectionCandidate candidate={candidate} key={candidate._id} />
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
