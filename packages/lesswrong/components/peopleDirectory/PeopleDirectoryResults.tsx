import React, { Fragment } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

const cellComponents = [
  "PeopleDirectoryUserCell",
  "PeopleDirectoryTextCell",
] as const;

type CellComponentName = typeof cellComponents[number];

type PeopleDirectoryColumn<T extends CellComponentName> = {
  label: string,
  sortable: boolean,
  componentName: T,
  props: Omit<ComponentProps<ComponentTypes[T]>, "user">,
}

const columns: PeopleDirectoryColumn<CellComponentName>[] = [
  {
    label: "Name",
    sortable: true,
    componentName: "PeopleDirectoryUserCell",
    props: {},
  },
  {
    label: "Role",
    sortable: true,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "jobTitle",
    },
  },
  {
    label: "Organization",
    sortable: true,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "organization",
    },
  },
  {
    label: "Bio",
    sortable: false,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "bio",
    },
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
  heading: {
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 0",
  },
  cell: {
    display: "flex",
    alignItems: "center",
    height: "100%",
    padding: "12px 6px",
    borderTop: `1px solid ${theme.palette.grey[600]}`,
  },
});

export const PeopleDirectoryResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results} = usePeopleDirectory();
  return (
    <div className={classes.root}>
      {columns.map(({label}) => (
        <div key={label} className={classes.heading}>
          {label}
        </div>
      ))}
      {results.map((result) => (
        <Fragment key={result._id}>
          {columns.map(({label, componentName, props}) => {
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
