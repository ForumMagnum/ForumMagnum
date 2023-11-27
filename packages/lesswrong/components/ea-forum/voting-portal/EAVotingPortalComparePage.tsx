import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { isAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

// TODO: implement
const EAVotingPortalComparePage = ({classes}: {classes: ClassesType}) => {
  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  return (
    <AnalyticsContext pageContext="eaVotingPortalCompare">
      <div className={classes.root}>
        <div className={classes.content} id="top">
          <div className={classes.h1}>
            Compare
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAVotingPortalComparePageComponent = registerComponent(
  "EAVotingPortalComparePage",
  EAVotingPortalComparePage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalComparePage: typeof EAVotingPortalComparePageComponent;
  }
}

