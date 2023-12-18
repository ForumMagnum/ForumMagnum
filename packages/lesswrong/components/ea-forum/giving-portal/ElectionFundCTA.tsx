import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { ForumIconName } from "../../common/ForumIcon";
import classNames from "classnames";
import { Link } from "../../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  /**
   * This class is unused.
   * Don't remove it or everything will break.
   * It has to be the first class in this object.
   * I don't have time to debug and this bug is making me nauseous.
   */
  unused: {
    display: "flex",
  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.givingPortal.ctaBackground,
    borderRadius: theme.borderRadius.default,
    maxWidth: "100%",
    width: 500,
    minHeight: 408,
    padding: "24px",
    fontSize: 16,
    lineHeight: '22px',
    letterSpacing: "-0.16px",
    fontWeight: 500,
    color: theme.palette.givingPortal.ctaText,
  },
  image: {
    color: theme.palette.givingPortal[1000],
  },
  title: {
    fontSize: 28,
    letterSpacing: "-0.28px",
    fontWeight: 700,
    color: theme.palette.givingPortal[1000],
  },
  description: {
    textAlign: "center",
  },
  children: {
    flexGrow: 1,
    textAlign: "center",
    width: "100%",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: "100%",
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
    borderRadius: theme.borderRadius.small,
    padding: 16,
    outline: "none",
    textAlign: "center",
    "&:active": {
      opacity: 0.8,
    },
  },
  outlineButton: {
    color: theme.palette.givingPortal.button.dark,
    border: `1.5px solid ${theme.palette.givingPortal.button.borderColor}`,
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: theme.palette.givingPortal.button.hoverOutlined,
      opacity: 1,
    },
  },
  solidButton: {
    color: theme.palette.givingPortal.button.light,
    backgroundColor: theme.palette.givingPortal.button.dark,
    border: `1.5px solid ${theme.palette.givingPortal.button.dark}`,
    "&:hover": {
      opacity: 0.9,
    },
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.65,
    "&:hover": {
      opacity: 0.65,
    },
    "&:active": {
      opacity: 0.65,
    },
  },
});

const ElectionFundCTA = ({
  image,
  title,
  description,
  buttonIcon,
  buttonText,
  href,
  onButtonClick,
  solidButton,
  disabled,
  children,
  classes,
}: {
  image: ReactNode,
  title: string,
  description: string,
  buttonIcon?: ForumIconName,
  buttonText: string,
  href?: string,
  onButtonClick?: () => void,
  solidButton?: boolean,
  disabled?: boolean,
  children?: ReactNode,
  classes: ClassesType,
}) => {
  const {ForumIcon} = Components;

  // Determine the appropriate button component based on the provided props
  let ButtonComponent;
  if (disabled) {
    ButtonComponent = 'div';
  } else if (href) {
    ButtonComponent = Link;
  } else {
    ButtonComponent = 'button';
  }

  const buttonNode = <ButtonComponent
    to={disabled ? undefined : href}
    onClick={disabled ? undefined : onButtonClick}
    className={classNames(classes.button, {
      [classes.outlineButton]: !solidButton,
      [classes.solidButton]: solidButton,
      [classes.buttonDisabled]: disabled,
    })}
  >
    {buttonIcon &&
      <ForumIcon icon={buttonIcon} className={classes.buttonIcon} />
    }
    {buttonText}
  </ButtonComponent>

  return (
    <AnalyticsContext pageSubSectionContext="electionFundCTA">
      <div className={classes.root}>
        <div className={classes.image}>{image}</div>
        <div className={classes.title}>{title}</div>
        <div className={classes.description}>{description}</div>
        <div className={classes.children}>{children}</div>
        <AnalyticsContext pageElementContext="electionFundCTAButton">
          {buttonNode}
        </AnalyticsContext>
      </div>
    </AnalyticsContext>
  );
}

const ElectionFundCTAComponent = registerComponent(
  "ElectionFundCTA",
  ElectionFundCTA,
  {styles},
);

declare global {
  interface ComponentTypes {
    ElectionFundCTA: typeof ElectionFundCTAComponent;
  }
}
