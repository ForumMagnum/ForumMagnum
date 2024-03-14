import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    border: `1px solid ${theme.palette.grey[310]}`,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.grey[0],
    color: theme.palette.grey[1000],
  },
  icon: {
    marginLeft: 12,
    height: 16,
  },
  input: {
    width: "100%",
    background: theme.palette.greyAlpha(0),
    padding: "8px 12px",
    fontSize: 14,
  },
});

export const PeopleDirectoryInput = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {query, setQuery} = usePeopleDirectory();
  const onChange = useCallback((ev) => {
    setQuery(ev.target?.value ?? "");
  }, [setQuery]);
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <ForumIcon icon="Search" className={classes.icon} />
      <input
        placeholder="Search for a person..."
        value={query}
        onChange={onChange}
        className={classes.input}
      />
    </div>
  );
}

const PeopleDirectoryInputComponent = registerComponent(
  "PeopleDirectoryInput",
  PeopleDirectoryInput,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryInput: typeof PeopleDirectoryInputComponent
  }
}
