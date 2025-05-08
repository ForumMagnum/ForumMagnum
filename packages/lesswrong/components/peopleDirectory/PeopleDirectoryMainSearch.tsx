import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";

const PeopleDirectoryMainSearchInner = () => {
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

export const PeopleDirectoryMainSearch = registerComponent(
  "PeopleDirectoryMainSearch",
  PeopleDirectoryMainSearchInner,
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryMainSearch: typeof PeopleDirectoryMainSearch
  }
}
