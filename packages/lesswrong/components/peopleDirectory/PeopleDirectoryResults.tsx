import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import PeopleDirectoryResultsList from "./PeopleDirectoryResultsList";
import PeopleDirectoryResultsMap from "./PeopleDirectoryResultsMap";

const PeopleDirectoryResults = () => {
  const {view} = usePeopleDirectory();
  return view === "list"
    ? <PeopleDirectoryResultsList />
    : <PeopleDirectoryResultsMap />;
}

export default registerComponent(
  "PeopleDirectoryResults",
  PeopleDirectoryResults,
);


