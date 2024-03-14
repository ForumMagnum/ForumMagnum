import React, { Fragment } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

type PeopleDirectoryColumn = {
  label: string,
  fieldName: string,
  sortable: boolean,
}

const columns: PeopleDirectoryColumn[] = [
  {
    label: "Name",
    fieldName: "displayName",
    sortable: true,
  },
  {
    label: "Role",
    fieldName: "role",
    sortable: true,
  },
  {
    label: "Organization",
    fieldName: "organization",
    sortable: true,
  },
  {
    label: "Bio",
    fieldName: "bio",
    sortable: false,
  },
];

const styles = (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
    padding: "12px 24px",
    width: "100%",
    border: `1px solid ${theme.palette.grey[310]}`,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.grey[0],
    color: theme.palette.grey[1000],
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
  },
});

export const PeopleDirectoryResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results} = usePeopleDirectory();
  return (
    <div className={classes.root}>
      {columns.map(({label}) => (
        <div key={label} className={classes.label}>
          {label}
        </div>
      ))}
      {results.map((result) => (
        <Fragment key={result._id}>
          <div>{result.displayName}</div>
          <div>{result.jobTitle}</div>
          <div>{result.organization}</div>
          <div>{result.bio}</div>
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
