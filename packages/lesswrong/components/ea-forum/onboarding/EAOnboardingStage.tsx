import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { OnboardingStage, useEAOnboarding } from "./useEAOnboarding";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    maxWidth: "100vw",
    maxHeight: "min(80vh, 720px)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
    [theme.breakpoints.down("xs")]: {
      maxHeight: "100vh",
      paddingBottom: 20,
    },
  },
  rootThin: {
    width: 540,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  rootWide: {
    width: 612,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  scrollable: {
    overflowY: "scroll",
    flexGrow: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: 30,
    fontWeight: 600,
    letterSpacing: "-0.6px",
    padding: 32,
    paddingBottom: 0,
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      textAlign: "center",
    },
  },
  lightbulb: {
    color: theme.palette.primary.dark,
    width: 42,
  },
  content: {
    overflow: "hidden",
    padding: "22px 32px",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "140%",
    [theme.breakpoints.down("xs")]: {
      textAlign: "center",
    },
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
    padding: 24,
    borderTop: `1px solid ${theme.palette.grey[310]}`,
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      borderTop: "none",
    },
  },
  footerContent: {
    flexGrow: 1,
  },
  skip: {
    fontWeight: 600,
    textDecoration: "none !important",
    "&:hover": {
      textDecoration: "underline !important",
    },
  },
  continue: {
    minWidth: "128px",
    height: 44,
    whiteSpace: "nowrap",
    padding: "12px 24px",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  spinner: {
    height: "20px !important",
  },
});

export const EAOnboardingStage = ({
  stageName,
  title,
  skippable,
  canContinue,
  onContinue,
  footer,
  hideHeader,
  hideFooter,
  thin,
  children,
  className,
  classes,
}: {
  stageName: OnboardingStage,
  title: string,
  skippable?: boolean,
  canContinue?: boolean,
  onContinue?: () => void | Promise<void>,
  footer?: ReactNode,
  hideHeader?: boolean,
  hideFooter?: boolean,
  thin?: boolean,
  children?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {currentStage, goToNextStage, nextStageIsLoading} = useEAOnboarding();
  const {captureEvent} = useTracking();

  const wrappedOnContinue = useCallback(async () => {
    await onContinue?.();
    captureEvent("onboardingContinue", {from: stageName});
    await goToNextStage();
  }, [onContinue, goToNextStage, captureEvent, stageName]);

  const onSkip = useCallback(async () => {
    captureEvent("onboardingSkip", {from: stageName});
    await goToNextStage();
  }, [goToNextStage, captureEvent, stageName]);

  if (currentStage !== stageName) {
    return null;
  }

  const {EAButton, Loading} = Components;
  return (
    <AnalyticsContext
      pageElementContext="onboardingFlow"
      pageElementSubContext={stageName}
    >
      <div className={classNames(classes.root, {
        [classes.rootThin]: thin,
        [classes.rootWide]: !thin,
      })}>
        <div className={classes.scrollable}>
          {!hideHeader &&
            <div className={classes.header}>
              <div className={classes.lightbulb}>{lightbulbIcon}</div>
              {title}
            </div>
          }
          <div className={classNames(classes.content, className)}>
            {children}
          </div>
        </div>
        {!hideFooter &&
          <div className={classes.footer}>
            <div className={classes.footerContent}>
              {footer}
            </div>
            {skippable &&
              <a
                onClick={onSkip}
                className={classes.skip}
                test-id={`ea-onboarding-skip-${stageName}`}
              >
                Skip for now
              </a>
            }
            <EAButton
              onClick={wrappedOnContinue}
              disabled={!canContinue || nextStageIsLoading}
              className={classes.continue}
            >
              {nextStageIsLoading
                ? <Loading className={classes.spinner} />
                : <>Continue -&gt;</>
              }
            </EAButton>
          </div>
        }
      </div>
    </AnalyticsContext>
  );
}

const EAOnboardingStageComponent = registerComponent(
  "EAOnboardingStage",
  EAOnboardingStage,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    EAOnboardingStage: typeof EAOnboardingStageComponent
  }
}
