import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";

const styles = (_theme: ThemeType) => ({
  root: {
    height: 842,
  },
});

const PeopleDirectoryResultsMapInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results} = usePeopleDirectory();
  const {RawSearchResultsMap} = Components;
  return (
    <RawSearchResultsMap
      hits={results as AnyBecauseTodo[]}
      from="people_directory"
      className={classes.root}
    />
  );
}

export const PeopleDirectoryResultsMap = registerComponent(
  "PeopleDirectoryResultsMap",
  PeopleDirectoryResultsMapInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResultsMap: typeof PeopleDirectoryResultsMap
  }
}
