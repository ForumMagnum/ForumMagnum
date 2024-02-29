import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { getPodcastDataByName } from "../../../lib/eaPodcasts";
import { useTracking } from "../../../lib/analyticsEvents";
import { useEAOnboarding } from "./useEAOnboarding";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 40,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
    },
  },
  content: {
    [theme.breakpoints.down("xs")]: {
      flexGrow: 1,
    },
  },
  thanks: {
    fontSize: 40,
    fontWeight: 600,
    letterSpacing: "-0.8px",
    marginBottom: 32,
    lineHeight: "initial",
  },
  title: {
    fontSize: 12,
  },
  section: {
    background: theme.palette.panelBackground.onboardingSection,
    borderRadius: theme.borderRadius.default,
    padding: "12px 16px",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    textAlign: "left",
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
  toggle: {
    [theme.breakpoints.down("xs")]: {
      marginLeft: 20,
    },
  },
  podcasts: {
    display: "flex",
    gap: "4px",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      "& > *": {
        flexBasis: "50%",
      },
    },
  },
  button: {
    width: "100%",
    padding: "12px 20px",
    marginTop: 28,
    fontSize: 14,
    fontWeight: 600,
  },
  mobileColumn: {
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "12px",
    },
  },
});

export const EAOnboardingThankYouStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const {currentStage, goToNextStage, currentUser, updateCurrentUser} = useEAOnboarding();
  const [subscribed, setSubscribed] = useState(true);

  useEffect(() => {
    // Default to subscribing to the digest
    if (!currentUser.subscribedToDigest && currentStage === 'thankyou') {
      void updateCurrentUser({
        subscribedToDigest: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);

  const setSubscribedToDigest = useCallback((value: boolean) => {
    setSubscribed(value);
    void updateCurrentUser({
      subscribedToDigest: value,
    });
    captureEvent("toggleDigest", {subscribed: value});
  }, [updateCurrentUser, captureEvent]);

  const onComplete = useCallback(() => {
    void goToNextStage();
    captureEvent("onboardingComplete");
  }, [goToNextStage, captureEvent]);

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
      <div className={classes.content}>
        <div className={classes.thanks}>
          Thanks for joining the discussion!
        </div>
        <SectionTitle title="Other ways to read posts" className={classes.title} />
        <div className={classes.section}>
          <div>
            <div className={classes.heading}>
              Get the best posts in your email with the Forum Digest
            </div>
            <div className={classes.subheading}>
              A weekly email curated by the Forum team
            </div>
          </div>
          <ToggleSwitch
            value={subscribed}
            setValue={setSubscribedToDigest}
            className={classes.toggle}
          />
        </div>
        <div className={classNames(classes.section, classes.mobileColumn)}>
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
      </div>
      <EAButton onClick={onComplete} className={classes.button}>
        Go to the Forum -&gt;
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
