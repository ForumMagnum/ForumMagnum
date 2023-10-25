import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import classNames from "classnames";
import { useElectionCandidates } from "./hooks";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    rowGap: "12px",
  },
});

const ElectionCandidatesList = ({className, classes}: {
  className?: string,
  classes: ClassesType,
}) => {
  const {results, loading} = useElectionCandidates();
  const {Loading, ElectionCandidate} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      {loading && <Loading />}
      {results?.map((candidate) => (
        <ElectionCandidate candidate={candidate} key={candidate._id} />
      ))}
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
