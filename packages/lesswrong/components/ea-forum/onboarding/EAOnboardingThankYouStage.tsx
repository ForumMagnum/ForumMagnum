import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
  },
  section: {
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.default,
    padding: 12,
  },
  heading: {
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 600,
  },
  subheading: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
  },
});

export const EAOnboardingThankYouStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {EAOnboardingStage, SectionTitle} = Components;
  return (
    <EAOnboardingStage
      stageName="thankyou"
      title="Thanks for joining the discussion"
      className={classes.root}
    >
      <SectionTitle title="Other ways to read posts" />
      <div className={classes.section}>
        <div className={classes.heading}>
          Get the best posts in your email with the Forum Digest
        </div>
        <div className={classes.subheading}>
          A weekly email curated by the Forum team
        </div>
      </div>
      <div className={classes.section}>
        <div className={classes.heading}>
          Listen to posts anywhere
        </div>
        <div className={classes.subheading}>
          Subscribe to the Forum podcast
        </div>
      </div>
    </EAOnboardingStage>
  );
}

const EAOnboardingThankYouStageComponent = registerComponent(
  "EAOnboardingThankYouStage",
  EAOnboardingThankYouStage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingThankYouStage: typeof EAOnboardingThankYouStageComponent
  }
}
