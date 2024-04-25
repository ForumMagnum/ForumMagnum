import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

export const PeopleDirectoryMainSearch = () => {
  const {query, setQuery} = usePeopleDirectory();
  const {PeopleDirectoryInput} = Components;
  return (
    <PeopleDirectoryInput
      value={query}
      setValue={setQuery}
      icon="Search"
      placeholder="Search name or bio..."
    />
  );
}

const PeopleDirectoryMainSearchComponent = registerComponent(
  "PeopleDirectoryMainSearch",
  PeopleDirectoryMainSearch,
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryMainSearch: typeof PeopleDirectoryMainSearchComponent
  }
}
