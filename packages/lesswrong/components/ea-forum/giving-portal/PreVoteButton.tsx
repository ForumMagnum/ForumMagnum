import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.givingPortal[0],
    fontSize: 20,
    "&:hover": {
      opacity: 0.5,
    },
  },
});

const PreVoteButton = ({className, classes}: {
  className?: string,
  classes: ClassesType,
}) => {
  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip
      title="Pre-vote"
      placement="bottom"
      className={className}
    >
      <ForumIcon icon="HeartOutline" className={classes.icon} />
    </LWTooltip>
  );
}

const PreVoteButtonComponent = registerComponent(
  "PreVoteButton",
  PreVoteButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    PreVoteButton: typeof PreVoteButtonComponent;
  }
}
