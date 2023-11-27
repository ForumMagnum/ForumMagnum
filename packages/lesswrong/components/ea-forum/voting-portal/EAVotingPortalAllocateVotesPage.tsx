import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { isAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { useNavigate } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

// TODO: implement
const EAVotingPortalAllocateVotesPage = ({classes}: {classes: ClassesType}) => {
  const { VotingPortalFooter } = Components;
  const navigate = useNavigate();

  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  return (
    <AnalyticsContext pageContext="eaVotingPortalAllocateVotes">
      <div className={classes.root}>
        <div className={classes.content} id="top">
          <div className={classes.h1}>Allocate</div>
        </div>
        <VotingPortalFooter
          leftHref="/voting-portal/compare"
          // TODO actual numbers
          middleNode={<div>Allocated to 0/12 projects</div>}
          buttonProps={{
            onClick: async () => {
              // TODO save allocation
              navigate({ pathname: "/voting-portal/submit" });
            },
          }}
        />
      </div>
    </AnalyticsContext>
  );
}

const EAVotingPortalAllocateVotesPageComponent = registerComponent(
  "EAVotingPortalAllocateVotesPage",
  EAVotingPortalAllocateVotesPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalAllocateVotesPage: typeof EAVotingPortalAllocateVotesPageComponent;
  }
}

