import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    color: theme.palette.grey[600],
    fontWeight: 500,
    fontSize: 14,
  },
  heading: {
    fontWeight: 600,
    fontSize: 20,
  },
  button: {
    marginTop: 10,
  },
});

const PeopleDirectoryNoResultsInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {clearSearch} = usePeopleDirectory();
  const {EAButton} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.heading}>No people found</div>
      <div>Try using different keywords or change your filters</div>
      <EAButton onClick={clearSearch} style="grey" className={classes.button}>
        Clear search
      </EAButton>
    </div>
  );
}

export const PeopleDirectoryNoResults = registerComponent(
  "PeopleDirectoryNoResults",
  PeopleDirectoryNoResultsInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryNoResults: typeof PeopleDirectoryNoResults
  }
}
