import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: 612,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },
});

export const EAOnboardingSubscribeStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const canContinue = false;

  const {EAOnboardingStage} = Components;
  return (
    <EAOnboardingStage
      stageName="subscribe"
      title={`Welcome to the EA Forum, ${currentUser?.displayName}!`}
      canContinue={canContinue}
      skippable
      className={classes.root}
    >
      <div className={classes.section}>
        <div>
          Subscribe to a topic to see more of it on the Forum Frontpage.
        </div>
      </div>
      <div className={classes.section}>
        <div>
          Subscribe to an author to get notified when they post. They won’t see this.
        </div>
      </div>
    </EAOnboardingStage>
  );
}

const EAOnboardingSubscribeStageComponent = registerComponent(
  "EAOnboardingSubscribeStage",
  EAOnboardingSubscribeStage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingSubscribeStage: typeof EAOnboardingSubscribeStageComponent
  }
}
