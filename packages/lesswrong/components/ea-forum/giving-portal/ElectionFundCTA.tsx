import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { ForumIconName } from "../../common/ForumIcon";
import classNames from "classnames";

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
    backgroundColor: theme.palette.givingPortal[0],
    borderRadius: theme.borderRadius.default,
    maxWidth: "100%",
    width: 500,
    minHeight: 408,
    padding: "32px 24px",
    fontSize: 16,
    letterSpacing: "-0.16px",
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  image: {
    width: 100,
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
    fontWeight: 600,
    borderRadius: theme.borderRadius.small,
    padding: 16,
    outline: "none",
    "&:active": {
      opacity: 0.8,
    },
  },
  outlineButton: {
    color: theme.palette.givingPortal[1000],
    border: `1.5px solid ${theme.palette.grey[340]}`,
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: theme.palette.grey[100],
    },
  },
  solidButton: {
    color: theme.palette.grey[0],
    border: `1.5px solid ${theme.palette.givingPortal[1000]}`,
    backgroundColor: theme.palette.givingPortal[1000],
    "&:hover": {
      opacity: 0.9,
    },
  },
  buttonIcon: {
    fontSize: 18,
  },
});

const ElectionFundCTA = ({
  image,
  title,
  description,
  buttonIcon,
  buttonText,
  onButtonClick,
  solidButton,
  children,
  classes,
}: {
  image: ReactNode,
  title: string,
  description: string,
  buttonIcon?: ForumIconName,
  buttonText: string,
  onButtonClick: () => void,
  solidButton?: boolean,
  children?: ReactNode,
  classes: ClassesType,
}) => {
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.image}>{image}</div>
      <div className={classes.title}>{title}</div>
      <div className={classes.description}>{description}</div>
      <div className={classes.children}>{children}</div>
      <button
        onClick={onButtonClick}
        className={classNames(classes.button, {
          [classes.outlineButton]: !solidButton,
          [classes.solidButton]: solidButton,
        })}
      >
        {buttonIcon &&
          <ForumIcon icon={buttonIcon} className={classes.buttonIcon} />
        }
        {buttonText}
      </button>
    </div>
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
