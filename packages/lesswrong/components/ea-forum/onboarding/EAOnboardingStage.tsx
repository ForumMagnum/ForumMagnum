import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    maxHeight: "80%",
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
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
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "28px",
    padding: 24,
    borderTop: `1px solid ${theme.palette.grey[310]}`,
  },
  footerContent: {
    flexGrow: 1,
  },
  skip: {
    fontWeight: 600,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  continue: {
    minWidth: "128px",
    whiteSpace: "nowrap",
    padding: "12px 24px",
  },
});

export const EAOnboardingStage = ({
  title,
  skippable,
  onSkip,
  canContinue,
  onContinue,
  footer,
  children,
  className,
  classes,
}: {
  title: string,
  skippable?: boolean,
  onSkip?: () => void | Promise<void>,
  canContinue?: boolean,
  onContinue?: () => void | Promise<void>,
  footer?: ReactNode,
  children?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {EAButton} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.lightbulb}>{lightbulbIcon}</div>
        {title}
      </div>
      <div className={classNames(classes.content, className)}>
        {children}
      </div>
      <div className={classes.footer}>
        <div className={classes.footerContent}>
          {footer}
        </div>
        {skippable &&
          <a onClick={onSkip} className={classes.skip}>
            Skip for now
          </a>
        }
        <EAButton
          onClick={onContinue}
          disabled={!canContinue}
          className={classes.continue}
        >
          Continue -&gt;
        </EAButton>
      </div>
    </div>
  );
}

const EAOnboardingStageComponent = registerComponent(
  "EAOnboardingStage",
  EAOnboardingStage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingStage: typeof EAOnboardingStageComponent
  }
}
