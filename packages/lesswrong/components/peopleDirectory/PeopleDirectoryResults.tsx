import React, { Fragment } from "react";
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
  cell: {
    display: "flex",
    alignItems: "center",
    height: 64,
    padding: "12px 6px",
    borderTop: `1px solid ${theme.palette.grey[600]}`,
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
  const {PeopleDirectoryHeading, Loading} = Components;
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
        <Fragment key={result._id}>
          {columns.map((column) => {
            if (column.hideable && column.hidden) {
              return null;
            }
            const {componentName, label, props} = column;
            const Component = Components[componentName] as AnyBecauseTodo;
            return (
              <div key={label} className={classes.cell}>
                <Component user={result} {...props} />
              </div>
            );
          })}
        </Fragment>
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
