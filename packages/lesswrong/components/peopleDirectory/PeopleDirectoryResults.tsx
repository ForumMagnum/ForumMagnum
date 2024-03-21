import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

const styles = (theme: ThemeType) => ({
  root: {
    display: "grid",
    padding: "12px 24px",
    width: "100%",
    border: `1px solid ${theme.palette.grey[310]}`,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.grey[0],
    color: theme.palette.grey[1000],
  },
  loading: {
    gridColumn: "1/-1",
    margin: 12,
  },
});

export const PeopleDirectoryResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results, resultsLoading, columns} = usePeopleDirectory();
  const columnCount = columns
    .filter((column) => !column.hideable || !column.hidden)
    .length;
  const {PeopleDirectoryHeading, PeopleDirectoryResultRow, Loading} = Components;
  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      }}
      className={classes.root}
    >
      {columns.map((column) =>
        !column.hideable || !column.hidden
          ? <PeopleDirectoryHeading key={column.label} column={column} />
          : null
      )}
      {results.map((result) => (
        <PeopleDirectoryResultRow key={result._id} result={result} />
      ))}
      {resultsLoading &&
        <div className={classes.loading}><Loading /></div>
      }
    </div>
  );
}

const PeopleDirectoryResultsComponent = registerComponent(
  "PeopleDirectoryResults",
  PeopleDirectoryResults,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResults: typeof PeopleDirectoryResultsComponent
  }
}
