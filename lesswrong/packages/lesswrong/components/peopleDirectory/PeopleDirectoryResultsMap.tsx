import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { RawSearchResultsMap } from "@/components/community/modules/SearchResultsMap";

const styles = (_theme: ThemeType) => ({
  root: {
    height: 842,
  },
});

const PeopleDirectoryResultsMap = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results} = usePeopleDirectory();
  return (
    <RawSearchResultsMap
      hits={results as AnyBecauseTodo[]}
      from="people_directory"
      className={classes.root}
    />
  );
}

const PeopleDirectoryResultsMapComponent = registerComponent(
  "PeopleDirectoryResultsMap",
  PeopleDirectoryResultsMap,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResultsMap: typeof PeopleDirectoryResultsMapComponent
  }
}

export default PeopleDirectoryResultsMapComponent;
