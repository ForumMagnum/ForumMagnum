import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
});

const QuickTakesEntry = () => {
  const {} = Components;
  return (
    <div>
      Entry
    </div>
  );
}

const QuickTakesEntryComponent = registerComponent(
  "QuickTakesEntry",
  QuickTakesEntry,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesEntry: typeof QuickTakesEntryComponent
  }
}
