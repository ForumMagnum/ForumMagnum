import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { getPodcastDataByName } from "../../../lib/eaPodcasts";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 600,
    letterSpacing: "-0.8px",
    marginBottom: 32,
    lineHeight: "initial",
  },
  section: {
    background: theme.palette.panelBackground.onboardingSection,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    "& > *:first-child": {
      flexGrow: 1,
    },
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
  podcasts: {
    display: "flex",
    gap: "4px",
  },
  button: {
    width: "100%",
    padding: "12px 20px",
    marginTop: 28,
    fontSize: 14,
    fontWeight: 600,
  },
});

export const EAOnboardingThankYouStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [subscribedToDigest, setSubscribedToDigest] = useState(true);

  const onClose = useCallback(() => {
    // TODO
  }, []);

  const {
    EAOnboardingStage, EAOnboardingPodcast, SectionTitle, EAButton, ToggleSwitch,
  } = Components;
  return (
    <EAOnboardingStage
      stageName="thankyou"
      title="Thanks for joining the discussion"
      className={classes.root}
      hideHeader
      hideFooter
    >
      <div className={classes.title}>
        Thanks for joining the discussion!
      </div>
      <SectionTitle title="Other ways to read posts" />
      <div className={classes.section}>
        <div>
          <div className={classes.heading}>
            Get the best posts in your email with the Forum Digest
          </div>
          <div className={classes.subheading}>
            A weekly email curated by the Forum team
          </div>
        </div>
        <ToggleSwitch value={subscribedToDigest} setValue={setSubscribedToDigest} />
      </div>
      <div className={classes.section}>
        <div>
          <div className={classes.heading}>
            Listen to posts anywhere
          </div>
          <div className={classes.subheading}>
            Subscribe to the Forum podcast
          </div>
        </div>
        <div className={classes.podcasts}>
          <EAOnboardingPodcast podcast={getPodcastDataByName("Spotify")} />
          <EAOnboardingPodcast podcast={getPodcastDataByName("Apple Podcasts")} />
        </div>
      </div>
      <EAButton onClick={onClose} className={classes.button}>
        Go to the forum -&gt;
      </EAButton>
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
