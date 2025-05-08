import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";

const PeopleDirectoryResultsInner = () => {
  const {view} = usePeopleDirectory();
  const {PeopleDirectoryResultsList, PeopleDirectoryResultsMap} = Components;
  return view === "list"
    ? <PeopleDirectoryResultsList />
    : <PeopleDirectoryResultsMap />;
}

export const PeopleDirectoryResults = registerComponent(
  "PeopleDirectoryResults",
  PeopleDirectoryResultsInner,
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResults: typeof PeopleDirectoryResults
  }
}
