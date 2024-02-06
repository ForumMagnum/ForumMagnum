import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";

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
    "& img": {
      zIndex: 1,
      position: "absolute",
      borderRadius: theme.borderRadius.default,
    },
    "& div": {
      fontSize: 13,
      fontWeight: 700,
      lineHeight: "16px",
      color: theme.palette.text.alwaysWhite,
      zIndex: 2,
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column-reverse",
      padding: 8,
      backgroundColor: theme.palette.tag.onboardingBackground,
      borderRadius: theme.borderRadius.default,
      "&:hover": {
        backgroundColor: theme.palette.tag.onboardingBackgroundHover,
      },
    },
  },
});

export const EAOnboardingSubscribeStage = ({tags, classes}: {
  tags: TagOnboarding[],
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const canContinue = false;

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
