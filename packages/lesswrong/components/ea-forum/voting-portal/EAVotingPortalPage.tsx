import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";
import { useLocation } from "react-router";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

const EAVotingPortalPage = ({classes}: {classes: ClassesType}) => {
  const {search} = useLocation();
  const params = new URLSearchParams(search);
  const isThankYouPage = params.get("complete") === "true";

  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  const {VotingPortalThankYou} = Components;
  return (
    <AnalyticsContext pageContext="eaVotingPortal">
      <div className={classes.root}>
        {isThankYouPage
          ? <VotingPortalThankYou />
          : (
            <div className={classes.content} id="top">
              <div className={classes.h1}>
                Voting portal
              </div>
            </div>
          )
        }
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
