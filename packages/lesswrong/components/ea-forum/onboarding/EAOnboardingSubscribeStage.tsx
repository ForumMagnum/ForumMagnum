import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { filterNonnull } from "../../../lib/utils/typeGuardUtils";
import { useCurrentUser } from "../../common/withUser";
import { useMulti } from "../../../lib/crud/withMulti";
import keyBy from "lodash/keyBy";

const TAG_SIZE = 103;

const styles = (theme: ThemeType) => ({
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
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    rowGap: "8px",
  },
  tag: {
    cursor: "pointer",
    userSelect: "none",
    width: TAG_SIZE,
    height: TAG_SIZE,
    position: "relative",
    fontSize: 13,
    fontWeight: 700,
    color: theme.palette.text.alwaysWhite,
    "& img": {
      zIndex: 1,
      position: "absolute",
      borderRadius: theme.borderRadius.default,
    },
    "& div": {
      zIndex: 2,
      position: "absolute",
      bottom: 0,
      margin: 8,
    },
  },
});

const tagIds = [
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

export const EAOnboardingSubscribeStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const canContinue = false;

  const {results: rawTags} = useMulti({
    collectionName: "Tags",
    fragmentName: "TagOnboarding",
    limit: tagIds.length,
    terms: {
      _id: tagIds,
    },
  });
  const tagsById = keyBy(rawTags, "_id");
  const tags = filterNonnull(tagIds.map((_id) => tagsById[_id]));

  const {EAOnboardingStage, CloudinaryImage2} = Components;
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
        <div className={classes.tagContainer}>
          {tags.map(({_id, name, squareImageId, bannerImageId}) => (
            <div key={_id} className={classes.tag}>
              <CloudinaryImage2
                publicId={squareImageId ?? bannerImageId}
                width={TAG_SIZE}
                height={TAG_SIZE}
                imgProps={{
                  dpr: String(window.devicePixelRatio ?? 1),
                  g: "center",
                }}
                objectFit="cover"
              />
              <div>{name}</div>
            </div>
          ))}
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
