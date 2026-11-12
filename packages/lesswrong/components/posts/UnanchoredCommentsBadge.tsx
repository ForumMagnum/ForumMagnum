import React, { useContext } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { InlineCommentsPanelContext } from "../common/sharedContexts";

const BADGE_SIZE = 16;

const styles = defineStyles("UnanchoredCommentsBadge", (theme: ThemeType) => ({
  badge: {
    ...theme.typography.commentStyle,
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    padding: "0 4px",
    borderRadius: BADGE_SIZE / 2,
    fontSize: 10,
    fontWeight: 600,
    lineHeight: `${BADGE_SIZE}px`,
    textAlign: "center",
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    boxShadow: `0 0 0 2px ${theme.palette.panelBackground.default}`,
    pointerEvents: "none",
  },
}));

/**
 * Badge for the editor's comments-panel toggle, showing how many comment
 * threads aren't attached to any text in the document (and so can only be
 * seen by opening the panel). The containing button must be position:relative.
 */
const UnanchoredCommentsBadge = () => {
  const classes = useStyles(styles);
  const { unanchoredCommentCount } = useContext(InlineCommentsPanelContext);
  if (unanchoredCommentCount <= 0) {
    return null;
  }
  return <span className={classes.badge}>
    {unanchoredCommentCount}
  </span>;
}

export default UnanchoredCommentsBadge;
