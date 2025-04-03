import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { styles } from "./PeopleDirectoryFilterDropdown";
import classNames from "classnames";

const PeopleDirectoryViewToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {view, setView} = usePeopleDirectory();
  const isList = view === "list";
  const onClick = useCallback(() => {
    setView(isList ? "map" : "list");
  }, [isList, setView]);
  const {ForumIcon} = Components;
  return (
    <div className={classNames(classes.container, classes.button)} onClick={onClick}>
      <div className={classes.title}>
        <ForumIcon
          icon={isList ? "Map" : "Bars3"}
          className={classes.icon}
        />
        {isList ? "Map" : "List"} view
      </div>
    </div>
  );
}

const PeopleDirectoryViewToggleComponent = registerComponent(
  "PeopleDirectoryViewToggle",
  PeopleDirectoryViewToggle,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryViewToggle: typeof PeopleDirectoryViewToggleComponent
  }
}
