import React, { ReactNode, useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { OnboardingStage, useEAOnboarding } from "./useEAOnboarding";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import classNames from "classnames";
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import DialogTitle from "@/lib/vendor/@material-ui/core/src/DialogTitle";
import DialogContent from "@/lib/vendor/@material-ui/core/src/DialogContent";
import DialogContentText from "@/lib/vendor/@material-ui/core/src/DialogContentText";
import DialogActions from "@/lib/vendor/@material-ui/core/src/DialogActions";
import { useCurrentUser } from "@/components/common/withUser";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
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
  closeButtonOuter: {
    position: "absolute",
    top: 16,
    right: 24,
  },
  close: {
    cursor: "pointer",
  },
  logoutDialog: {
    zIndex: theme.zIndexes.confirmLogoutModal,
    minWidth: 300,
  },
  logoutDialogTitle: {
    marginTop: 0,
  },
  logoutDialogText: {
    marginTop: 0,
    marginBottom: 2,
  },
  logoutDialogActions: {
    marginRight: 16,
    marginBottom: 16,
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
  hideFooterButton,
  thin,
  children,
  className,
  icon = lightbulbIcon,
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
  hideFooterButton?: boolean,
  thin?: boolean,
  children?: ReactNode,
  className?: string,
  icon?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const {currentStage, goToNextStage, nextStageIsLoading, captureOnboardingEvent} = useEAOnboarding();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  // Opens the logout confirmation dialog when the x button is clicked
  // TODO; rename
  const handleClose = useCallback(() => {
    console.log('handleClose');
    setLogoutDialogOpen(true);
  }, []);
  
  // Closes the dialog without logging out
  const handleDialogCancel = useCallback(() => {
    setLogoutDialogOpen(false);
  }, []);
  
  // Confirm logout – insert your logout logic here
  const handleConfirmLogout = useCallback(() => {
    // Implement your logout logic (e.g., call an API, clear auth tokens, redirect)
    setLogoutDialogOpen(false);
  }, []);
  
  const currentUser = useCurrentUser();
  
  const wrappedOnContinue = useCallback(async () => {
    await onContinue?.();
    captureOnboardingEvent("onboardingContinue", {from: stageName});
    await goToNextStage();
  }, [onContinue, goToNextStage, captureOnboardingEvent, stageName]);

  const onSkip = useCallback(async () => {
    captureOnboardingEvent("onboardingSkip", {from: stageName});
    await goToNextStage();
  }, [goToNextStage, captureOnboardingEvent, stageName]);

  if (currentStage !== stageName) {
    return null;
  }

  const {EAButton, Loading, LWTooltip, ForumIcon, LWDialog, Typography} = Components;
  return (
    <AnalyticsContext
      pageElementContext="onboardingFlow"
      pageElementSubContext={stageName}
    >
      <div className={classNames(classes.root, {
        [classes.rootThin]: thin,
        [classes.rootWide]: !thin,
      })}>
        <div className={classes.closeButtonOuter}>
          <LWTooltip title="logout">
            <IconButton onClick={handleClose} className={classes.close}>
              <ForumIcon icon="Close" />
            </IconButton>
          </LWTooltip>
        </div>
        <div className={classes.scrollable}>
          {!hideHeader &&
            <div className={classes.header}>
              {icon && <div className={classes.lightbulb}>{icon}</div>}
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
                data-testid={`onboarding-skip-${stageName}`}
              >
                Skip for now
              </a>
            }
            {!hideFooterButton &&
              <EAButton
                onClick={wrappedOnContinue}
                disabled={!canContinue || nextStageIsLoading}
                data-testid={`onboarding-continue-${stageName}`}
                className={classes.continue}
              >
                {nextStageIsLoading
                  ? <Loading className={classes.spinner} />
                  : <>Continue -&gt;</>
                }
              </EAButton>
            }
          </div>
        }
        <LWDialog open={logoutDialogOpen} onClose={handleDialogCancel} className={classes.logoutDialog}>
          <DialogTitle disableTypography>
            <Typography variant="display1" className={classes.logoutDialogTitle}>
              Confirm Logout
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <p className={classes.logoutDialogText}>You are currently logged in with the email</p>
              <p className={classes.logoutDialogText}>{currentUser?.email ?? "(no email found)"}</p>
              <p className={classes.logoutDialogText}>But have not chosen a username.</p>
            </DialogContentText>
          </DialogContent>
          <DialogActions className={classes.logoutDialogActions}>
            <EAButton onClick={handleDialogCancel} style="grey">
              Cancel
            </EAButton>
            <EAButton onClick={handleConfirmLogout} autoFocus>
              Logout
            </EAButton>
          </DialogActions>
        </LWDialog>
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
