import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { CAREER_STAGES } from "../../../lib/collections/users/schema";
import { useEAOnboarding } from "./useEAOnboarding";
import EAOnboardingStage from "@/components/ea-forum/onboarding/EAOnboardingStage";
import EAOnboardingInput from "@/components/ea-forum/onboarding/EAOnboardingInput";
import EAOnboardingSelect from "@/components/ea-forum/onboarding/EAOnboardingSelect";
import { SectionTitle } from "@/components/common/SectionTitle";

const styles = (_theme: ThemeType) => ({
  root: {
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
  },
});

export const EAOnboardingWorkStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {updateCurrentUser, goToNextStage, goToNextStageAfter, viewAsAdmin} = useEAOnboarding();
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [careerStage, setCareerStage] = useState("");

  const onContinue = useCallback(async () => {
    // If this is an admin testing, don't make any changes
    if (viewAsAdmin) {
      await goToNextStage()
      return
    }

    await goToNextStageAfter(
      updateCurrentUser({
        jobTitle: role,
        organization,
        careerStage: [careerStage],
      }),
    );
  }, [role, organization, careerStage, updateCurrentUser, goToNextStage, goToNextStageAfter, viewAsAdmin]);

  const canContinue = !!(role || organization || careerStage);
  return (
    <EAOnboardingStage
      stageName="work"
      title="What do you do?"
      canContinue={canContinue}
      onContinue={onContinue}
      skippable
      className={classes.root}
    >
      <div>
        If this is relevant to you, share your role to make it easier for others
        to help you and ask for your help.
      </div>
      <div>
        <SectionTitle title="Role" titleClassName={classes.title} />
        <EAOnboardingInput
          value={role}
          setValue={setRole}
          placeholder="e.g. Software engineer"
        />
      </div>
      <div>
        <SectionTitle title="Organization" titleClassName={classes.title} />
        <EAOnboardingInput
          value={organization}
          setValue={setOrganization}
          placeholder="e.g. Centre for Effective Altruism"
        />
      </div>
      <div>
        <SectionTitle title="Career stage" titleClassName={classes.title} />
        <EAOnboardingSelect
          value={careerStage}
          setValue={setCareerStage}
          options={CAREER_STAGES}
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

export default EAOnboardingWorkStageComponent;
