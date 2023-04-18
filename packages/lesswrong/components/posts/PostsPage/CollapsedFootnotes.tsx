import React, { ReactElement, useState, useEffect } from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { useLocation } from "../../../lib/routeUtil";
import Collapse from "@material-ui/core/Collapse";

export const EXPAND_FOOTNOTES_EVENT = "expand-footnotes";

export const locationHashIsFootnote = (hash: string) =>
  hash.startsWith("#fn") && !hash.startsWith("#fnref");

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
    "&:hover": {
      background: theme.palette.grey[140],
    },
  },
});

const CollapsedFootnotes = ({children, classes}: {
  children: ReactElement,
  classes: ClassesType,
}) => {
  const {hash} = useLocation();
  const [collapsed, setCollapsed] = useState(!locationHashIsFootnote(hash ?? ""));

  useEffect(() => {
    const handler = () => setCollapsed(false);
    window.addEventListener(EXPAND_FOOTNOTES_EVENT, handler);
    return () => window.removeEventListener(EXPAND_FOOTNOTES_EVENT, handler);
  }, []);

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
