import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { RawSearchResultsMap } from "../community/modules/SearchResultsMap";

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

export default registerComponent(
  "PeopleDirectoryResultsMap",
  PeopleDirectoryResultsMap,
  {styles},
);


