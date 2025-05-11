import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import PeopleDirectoryInput from "./PeopleDirectoryInput";

const PeopleDirectoryMainSearch = () => {
  const {query, setQuery} = usePeopleDirectory();
  return (
    <PeopleDirectoryInput
      value={query}
      setValue={setQuery}
      icon="Search"
      placeholder="Search name or bio..."
    />
  );
}

export default registerComponent(
  "PeopleDirectoryMainSearch",
  PeopleDirectoryMainSearch,
);


