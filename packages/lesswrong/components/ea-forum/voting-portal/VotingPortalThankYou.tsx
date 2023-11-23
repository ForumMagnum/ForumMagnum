import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
});

const VotingPortalThankYou = () => {
  return (
    <div>
      Thank you
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
