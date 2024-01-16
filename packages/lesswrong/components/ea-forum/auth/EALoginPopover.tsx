import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import Popover from "@material-ui/core/Popover";
import { Link } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.panelBackground.modalBackground,
    borderRadius: theme.borderRadius.default,
    padding: 32,
    width: 386,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    textAlign: "center",
  },
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    background: theme.palette.background.loginBackdrop,
    backdropFilter: "blur(4px)",
  },
  lightbulb: {
    color: theme.palette.primary.dark,
    width: 52,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  finePrint: {
    color: theme.palette.grey[600],
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "140%",
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
  },
});

export const EALoginPopover = ({open, onClose, isSignup, classes}: {
  open: boolean,
  onClose: () => void,
  isSignup: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const title = isSignup
    ? "Sign in to get more from the EA Forum"
    : "Welcome back";

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="none"
      ModalClasses={{root: classes.modal}}
      BackdropProps={{className: classes.backdrop}}
    >
      {open &&
        <div className={classes.root}>
          <div className={classes.lightbulb}>{lightbulbIcon}</div>
          <div className={classes.title}>{title}</div>
          <div className={classes.finePrint}>
            By creating an{" "}
            <Link to="https://effectivealtruism.org">EffectiveAltruism.org</Link>{" "}
            account, you agree to the{" "}
            <Link to="/termsOfUse">Terms of Use</Link> and{" "}
            <Link to="#">Privacy Policy</Link>. {/* TODO: Privacy policy link? */}
          </div>
        </div>
      }
    </Popover>
  );
}

const EALoginPopoverComponent = registerComponent(
  "EALoginPopover",
  EALoginPopover,
  {styles},
);

declare global {
  interface ComponentTypes {
    EALoginPopover: typeof EALoginPopoverComponent
  }
}
