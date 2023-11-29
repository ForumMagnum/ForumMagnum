import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";
import { useNavigate } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

// TODO: implement
const EAVotingPortalSubmitPage = ({classes}: {classes: ClassesType}) => {
  const { VotingPortalFooter } = Components;
  const navigate = useNavigate();

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
        <VotingPortalFooter
          leftHref="/voting-portal/allocate-votes"
          // TODO actual numbers
          middleNode={<></>}
          buttonText="Submit your vote"
          buttonProps={{
            onClick: async () => {
              // TODO save allocation
              navigate({ pathname: "/voting-portal" });
            },
            disabled: true,
          }}
        />
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

