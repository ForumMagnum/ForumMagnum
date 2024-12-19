import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    borderRadius: 100,
    "&:hover": {
      opacity: 0.8,
    },
  },
  icon: {
    width: 18,
  },
});

const WrappedShareButton = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {ForumIcon} = Components;
  return (
    <button className={classes.root}>
      <ForumIcon icon="Share" className={classes.icon} /> Share
    </button>
  );
}

const WrappedShareButtonComponent = registerComponent(
  "WrappedShareButton",
  WrappedShareButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedShareButton: typeof WrappedShareButtonComponent
  }
}
