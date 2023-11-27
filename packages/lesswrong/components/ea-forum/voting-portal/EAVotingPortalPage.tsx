import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

// TODO: implement (this will be the intro page before submitting, and then the thank you page after)
const EAVotingPortalPage = ({classes}: {classes: ClassesType}) => {
  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  return (
    <AnalyticsContext pageContext="eaVotingPortal">
      <div className={classes.root}>
        <div className={classes.content} id="top">
          <div className={classes.h1}>
            Voting portal
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAVotingPortalPageComponent = registerComponent(
  "EAVotingPortalPage",
  EAVotingPortalPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalPage: typeof EAVotingPortalPageComponent;
  }
}

