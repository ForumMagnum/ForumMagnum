import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

const QuickTakesList = ({className, classes}: {
  className?: string,
  classes: ClassesType,
}) => {
  const {} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      List
    </div>
  );
}

const QuickTakesListComponent = registerComponent(
  "QuickTakesList",
  QuickTakesList,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesList: typeof QuickTakesListComponent
  }
}
