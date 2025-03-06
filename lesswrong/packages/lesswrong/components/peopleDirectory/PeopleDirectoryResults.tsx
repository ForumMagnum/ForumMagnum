import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import PeopleDirectoryResultsList from "@/components/peopleDirectory/PeopleDirectoryResultsList";
import PeopleDirectoryResultsMap from "@/components/peopleDirectory/PeopleDirectoryResultsMap";

const PeopleDirectoryResults = () => {
  const {view} = usePeopleDirectory();
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

export default PeopleDirectoryResultsComponent;
