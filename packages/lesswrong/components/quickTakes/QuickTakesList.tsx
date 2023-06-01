import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
});

const QuickTakesList = () => {
  const {} = Components;
  return (
    <div>
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
