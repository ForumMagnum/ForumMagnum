import React, { useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { CAREER_STAGES } from "../../../lib/collections/users/schema";

const styles = (_theme: ThemeType) => ({
  root: {
    marginBottom: 10,
  },
});

export const EAOnboardingWorkStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [careerStage, setCareerStage] = useState("");

  const canContinue = false;
  const {
    EAOnboardingStage, EAOnboardingInput, EAOnboardingSelect, SectionTitle,
  } = Components;
  return (
    <EAOnboardingStage
      stageName="work"
      title="What do you do?"
      canContinue={canContinue}
      skippable
      className={classes.root}
    >
      <div>
        If this is relevant to you, share your role to make it easier for others
        to help you and ask for your help.
      </div>
      <div>
        <SectionTitle title="Role" />
        <EAOnboardingInput
          value={role}
          setValue={setRole}
          placeholder="Software engineer"
        />
      </div>
      <div>
        <SectionTitle title="Organization" />
        <EAOnboardingInput
          value={organization}
          setValue={setOrganization}
          placeholder="Centre for Effective Altruism"
        />
      </div>
      <div>
        <SectionTitle title="Career stage" />
        <EAOnboardingSelect
          value={careerStage}
          setValue={setCareerStage}
          options={CAREER_STAGES}
          placeholder="Work (6-15 years)"
        />
      </div>
    </EAOnboardingStage>
  );
}

const EAOnboardingWorkStageComponent = registerComponent(
  "EAOnboardingWorkStage",
  EAOnboardingWorkStage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingWorkStage: typeof EAOnboardingWorkStageComponent
  }
}
