import React, { Fragment } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { peopleDirectoryColumns } from "./peopleDirectoryColumns";

const styles = (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: `repeat(${peopleDirectoryColumns.length}, 1fr)`,
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
});

export const PeopleDirectoryResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results} = usePeopleDirectory();
  const {PeopleDirectoryHeading} = Components;
  return (
    <div className={classes.root}>
      {peopleDirectoryColumns.map((column) => (
        <PeopleDirectoryHeading key={column.label} column={column} />
      ))}
      {results.map((result) => (
        <Fragment key={result._id}>
          {peopleDirectoryColumns.map(({label, componentName, props}) => {
            const Component = Components[componentName] as AnyBecauseTodo;
            return (
              <div key={label} className={classes.cell}>
                <Component user={result} {...props} />
              </div>
            );
          })}
        </Fragment>
      ))}
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
