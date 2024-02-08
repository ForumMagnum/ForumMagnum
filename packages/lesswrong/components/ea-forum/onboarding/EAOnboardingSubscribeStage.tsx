import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { useSuggestedSubscriptions } from "./useSuggestedSubscriptions";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },
  gridContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    rowGap: "8px",
  },
});

export const EAOnboardingSubscribeStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const {tags, users} = useSuggestedSubscriptions();

  const canContinue = false;

  const {
    EAOnboardingStage, EAOnboardingTag, EAOnboardingUser, Loading,
  } = Components;
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
        <div className={classes.gridContainer}>
          {tags.length < 1 && <Loading />}
          {tags.map((tag) => <EAOnboardingTag key={tag._id} tag={tag} />)}
        </div>
      </div>
      <div className={classes.section}>
        <div>
          Subscribe to an author to get notified when they post. They won’t see this.
        </div>
        <div className={classes.gridContainer}>
          {users.length < 1 && <Loading />}
          {users.map((user) => <EAOnboardingUser key={user._id} user={user} />)}
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
