import React, { useCallback } from "react";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { styles } from "./PeopleDirectoryFilterDropdown";
import classNames from "classnames";
import ForumIcon from "../common/ForumIcon";
import { useStyles } from "../hooks/useStyles";

const PeopleDirectoryViewToggle = () => {
  const classes = useStyles(styles);
  const {view, setView} = usePeopleDirectory();
  const isList = view === "list";
  const onClick = useCallback(() => {
    setView(isList ? "map" : "list");
  }, [isList, setView]);
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

export default PeopleDirectoryViewToggle;


