import React, { useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useMulti } from "../../../lib/crud/withMulti";
import keyBy from "lodash/keyBy";
import { filterNonnull } from "../../../lib/utils/typeGuardUtils";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
});

type OnboardingStage = "user" | "subscribe";

const subscribeTagIds = [
  "sWcuTyTB5dP3nas2t", // Global health and development
  "QdH9f8TC6G8oGYdgt", // Animal welfare
  "ee66CtAMYurQreWBH", // Existential risk
  "H43gvLzBCacxxamPe", // Biosecurity and pandemics
  "oNiQsBHA3i837sySD", // AI safety
  "4eyeLKC64Yvznzt6Z", // Philosophy
  "EHLmbEmJ2Qd5WfwTb", // Building effective altruism
  "aJnrnnobcBNWRsfAw", // Forecasting and estimation
  "psBzwdY8ipfCeExJ7", // Cause prioritisation
  "4CH9vsvzyk4mSKwyZ", // Career choice
];

export const EAOnboardingFlow = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [stage, setStage] = useState<OnboardingStage>("subscribe");

  const {results: rawTags} = useMulti({
    collectionName: "Tags",
    fragmentName: "TagOnboarding",
    limit: subscribeTagIds.length,
    terms: {
      _id: subscribeTagIds,
    },
  });
  const tagsById = keyBy(rawTags, "_id");
  const tags = filterNonnull(subscribeTagIds.map((_id) => tagsById[_id]));

  const {
    BlurredBackgroundModal, EAOnboardingUserStage, EAOnboardingSubscribeStage,
  } = Components;
  return (
    <BlurredBackgroundModal open className={classes.root}>
      {stage === "user" && <EAOnboardingUserStage />}
      {stage === "subscribe" && <EAOnboardingSubscribeStage tags={tags} />}
    </BlurredBackgroundModal>
  );
}

const EAOnboardingFlowComponent = registerComponent(
  "EAOnboardingFlow",
  EAOnboardingFlow,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingFlow: typeof EAOnboardingFlowComponent
  }
}
