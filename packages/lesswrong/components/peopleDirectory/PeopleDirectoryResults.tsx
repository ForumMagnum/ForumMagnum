import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

const PeopleDirectoryResults = () => {
  const {view} = usePeopleDirectory();
  const {PeopleDirectoryResultsList, PeopleDirectoryResultsMap} = Components;
  return view === "list"
    ? <PeopleDirectoryResultsList />
    : <PeopleDirectoryResultsMap />;
}

const PeopleDirectoryResultsComponent = registerComponent(
  "PeopleDirectoryResults",
  PeopleDirectoryResults,
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResults: typeof PeopleDirectoryResultsComponent
  }
}
