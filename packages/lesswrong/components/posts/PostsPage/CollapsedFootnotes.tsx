import React, { ReactElement, useState } from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { Collapse } from "@material-ui/core";

const styles = (theme: ThemeType) => ({
  button: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    background: theme.palette.grey[50],
    padding: 6,
    textAlign: "center",
    cursor: "pointer",
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
});

const CollapsedFootnotes = ({children, classes}: {
  children: ReactElement,
  classes: ClassesType,
}) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div>
      <Collapse in={!collapsed} collapsedHeight="41px">
        {children}
      </Collapse>
      <Collapse in={collapsed}>
        <div
          className={classes.button}
          onClick={() => setCollapsed(false)}
          role="button"
        >
          Expand footnotes
        </div>
      </Collapse>
    </div>
  );
}

const CollapsedFootnotesComponent = registerComponent(
  "CollapsedFootnotes",
  CollapsedFootnotes,
  {styles},
);

declare global {
  interface ComponentTypes {
    CollapsedFootnotes: typeof CollapsedFootnotesComponent
  }
}
