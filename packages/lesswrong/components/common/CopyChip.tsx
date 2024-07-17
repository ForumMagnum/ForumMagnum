import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMessages } from "../common/withMessages";

const styles = (theme: ThemeType) => ({
  root: {
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.grey[200],
    padding: "4px 6px",
    display: "flex",
    alignItems: "center",
    fontSize: 14,
    cursor: "pointer",
    gap: "2px",
    "&:hover": {
      backgroundColor: theme.palette.grey[300],
    },
  },
  icon: {
    color: theme.palette.grey[600],
    padding: 1,
  },
});

const CopyChip = ({ text, classes }: { text: string; classes: ClassesType<typeof styles> }) => {
  const { ForumIcon } = Components;
  const { flash } = useMessages();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    flash(`"${text}" copied to clipboard`);
  }, [flash, text]);

  return (
    <div className={classes.root} onClick={handleCopy}>
      <span>{text}</span>
      <ForumIcon icon="ClipboardDocument" className={classes.icon} />
    </div>
  );
};

const CopyChipComponent = registerComponent(
  "CopyChip",
  CopyChip,
  { styles }
);

declare global {
  interface ComponentTypes {
    CopyChip: typeof CopyChipComponent;
  }
}
