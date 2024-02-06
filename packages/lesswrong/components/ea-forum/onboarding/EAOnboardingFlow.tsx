import React, { useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useMulti } from "../../../lib/crud/withMulti";
import { filterNonnull } from "../../../lib/utils/typeGuardUtils";
import keyBy from "lodash/keyBy";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
});

type OnboardingStage = "user" | "subscribe" | "work" | "thankyou";

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

const subscribeUserIds = [
  "9Fg4woeMPHoGa6kDA", // Holden Karnofsky
  "kBZnCSYFXGowSD8mD", // Katja Grace
  "b4mnJTtwXMkqkv3Yq", // Laura Duffy
  "DkFp3vmyWxPmDqNcp", // Richard Y Chappell
  "H3tBLXCQEMqkyJiMJ", // Kelsey Piper
  "LMgZyi4w3XoYz3tM5", // sauilius
  "R4mvcEPhmLiBahN4H", // Toby Ord
  "JBx8HXhshWMMKpafM", // Jacob_Peacock
  "Ng9dxDSsc5uK4Zsmx", // CarlShulman
  "J8rxnfpHSTCbDNC2j", // Joe_Carlsmith
];

export const EAOnboardingFlow = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [stage, setStage] = useState<OnboardingStage>("thankyou");

  // We load the tags and users here immediately, so hopefully they'll have
  // loaded by the time the user has entered their display name and moved to
  // the subscribe stage
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

  const {results: rawUsers} = useMulti({
    collectionName: "Users",
    fragmentName: "UserOnboarding",
    limit: subscribeUserIds.length,
    terms: {
      view: "usersByUserIds",
      userIds: subscribeUserIds,
    },
  });
  const usersById = keyBy(rawUsers, "_id");
  const users = filterNonnull(subscribeUserIds.map((_id) => usersById[_id]));

  const {
    BlurredBackgroundModal, EAOnboardingUserStage, EAOnboardingSubscribeStage,
    EAOnboardingWorkStage, EAOnboardingThankYouStage,
  } = Components;
  return (
    <BlurredBackgroundModal open className={classes.root}>
      {stage === "user" &&
        <EAOnboardingUserStage />
      }
      {stage === "subscribe" &&
        <EAOnboardingSubscribeStage tags={tags} users={users} />
      }
      {stage === "work" &&
        <EAOnboardingWorkStage />
      }
      {stage === "thankyou" &&
        <EAOnboardingThankYouStage />
      }
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
