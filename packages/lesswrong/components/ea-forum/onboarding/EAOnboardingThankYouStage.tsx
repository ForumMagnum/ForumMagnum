import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { getPodcastDataByName } from "../../../lib/eaPodcasts";
import { useEAOnboarding } from "./useEAOnboarding";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 40,
    display: "flex",
    flexDirection: "column",
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
    marginBottom: 12,
    display: "flex",
    gap: 16,
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
  helpImproveForum: {
    background: theme.palette.panelBackground.onboardingSection,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    marginTop: 32,
    // win a specificity battle with EAOnboardingStage
    '&& a': {
      textDecoration: 'none',
    },
  },
  helpImproveForumButton: {
    fontWeight: 600,
    marginTop: 12,
    padding: '8px 16px',
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
  footer: {
    textAlign: 'center',
  },
  footerButton: {
    width: "100%",
    maxWidth: 500,
    padding: "12px 20px",
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
  const {currentStage, goToNextStage, currentUser, updateCurrentUser, captureOnboardingEvent, viewAsAdmin} = useEAOnboarding();
  const [subscribedToDigest, setSubscribedToDigest] = useState(true);
  const [subscribedToNewsletter, setSubscribedToNewsletter] = useState(false);

  useEffect(() => {
    // Default to subscribing to the digest (unless this is an admin testing)
    if (!currentUser.subscribedToDigest && currentStage === 'thankyou' && !viewAsAdmin) {
      void updateCurrentUser({
        subscribedToDigest: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);

  const toggleSubscribedToDigest = useCallback((value: boolean) => {
    setSubscribedToDigest(value);
    // If this is an admin testing, don't make any changes
    !viewAsAdmin && void updateCurrentUser({
      subscribedToDigest: value,
    });
    captureOnboardingEvent("toggleDigest", {subscribed: value});
  }, [updateCurrentUser, captureOnboardingEvent, viewAsAdmin]);

  const toggleSubscribedToNewsletter = useCallback((value: boolean) => {
    setSubscribedToNewsletter(value);
    !viewAsAdmin && void updateCurrentUser({
      subscribedToNewsletter: value,
    });
    captureOnboardingEvent("toggleNewsletter", {subscribed: value});
  }, [updateCurrentUser, captureOnboardingEvent, viewAsAdmin]);

  const onComplete = useCallback(() => {
    void goToNextStage();
    captureOnboardingEvent("onboardingComplete");
  }, [goToNextStage, captureOnboardingEvent]);

  const {
    EAOnboardingStage, EAOnboardingPodcast, SectionTitle, EAButton, ToggleSwitch,
  } = Components;
  return (
    <EAOnboardingStage
      stageName="thankyou"
      title="Thanks for joining the discussion"
      className={classes.root}
      hideHeader
      footer={
        <div className={classes.footer}>
          <EAButton onClick={onComplete} className={classes.footerButton}>
            Go to the Forum -&gt;
          </EAButton>
        </div>
      }
      hideFooterButton
    >
      <div className={classes.content}>
        <div className={classes.thanks}>
          Thanks for joining the discussion!
        </div>
        <SectionTitle title="Email updates" titleClassName={classes.title} />
        <div className={classes.section}>
          <div>
            <div className={classes.heading}>
              Weekly top Forum posts
            </div>
            <div className={classes.subheading}>
              The Forum Digest is curated by the Forum team
            </div>
          </div>
          <ToggleSwitch
            value={subscribedToDigest}
            setValue={toggleSubscribedToDigest}
            className={classes.toggle}
          />
        </div>
        <div className={classes.section}>
          <div>
            <div className={classes.heading}>
              Monthly EA Newsletter
            </div>
            <div className={classes.subheading}>
              Jobs, opportunities, the month's best articles, and more
            </div>
          </div>
          <ToggleSwitch
            value={subscribedToNewsletter}
            setValue={toggleSubscribedToNewsletter}
            className={classes.toggle}
          />
        </div>
        <div className={classes.helpImproveForum}>
          <div>
            <div className={classes.heading}>
              Help us improve the Forum
            </div>
            <div className={classes.subheading}>
              A 20-min call on what you hope to get from EA and the Forum.
            </div>
          </div>
          <EAButton style="grey" className={classes.helpImproveForumButton} href="https://tally.so/r/mDMR55">
            Sign up here
          </EAButton>
        </div>
        {/* <div className={classNames(classes.section, classes.mobileColumn)}>
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
        </div> */}
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
