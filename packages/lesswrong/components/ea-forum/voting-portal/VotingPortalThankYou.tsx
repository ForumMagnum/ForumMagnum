import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    height: "100%",
  },
});

const VotingPortalThankYou = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <div>
        Thank you
      </div>
    </div>
  );
}

const VotingPortalThankYouComponent = registerComponent(
  "VotingPortalThankYou",
  VotingPortalThankYou,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalThankYou: typeof VotingPortalThankYouComponent;
  }
}
