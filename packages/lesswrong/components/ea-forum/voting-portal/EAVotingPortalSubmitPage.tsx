import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

// TODO: implement
const EAVotingPortalSubmitPage = ({classes}: {classes: ClassesType}) => {
  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  return (
    <AnalyticsContext pageContext="eaVotingPortalSubmit">
      <div className={classes.root}>
        <div className={classes.content} id="top">
          <div className={classes.h1}>
            Submit
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAVotingPortalSubmitPageComponent = registerComponent(
  "EAVotingPortalSubmitPage",
  EAVotingPortalSubmitPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalSubmitPage: typeof EAVotingPortalSubmitPageComponent;
  }
}

