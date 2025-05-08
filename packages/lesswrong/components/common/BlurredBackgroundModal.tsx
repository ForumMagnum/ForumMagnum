import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import Popover from "@/lib/vendor/@material-ui/core/src/Popover";
import Fade from "@/lib/vendor/@material-ui/core/src/Fade";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.modalBackground,
    borderRadius: theme.borderRadius.default,
    maxWidth: "100%",
    padding: 32,
    overflowY: "auto",
    [theme.breakpoints.down("xs")]: {
      borderRadius: 0,
      width: "100vw !important",
      height: "100vh !important",
    },
  },
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: theme.zIndexes.blurredBackgroundModal,
    [theme.breakpoints.down("xs")]: {
      "& .MuiPopover-paper": {
        maxWidth: "unset !important",
        maxHeight: "unset !important",
      },
    },
  },
  backdrop: {
    background: theme.palette.background.loginBackdrop,
    backdropFilter: "blur(4px)",
  },
});

export const BlurredBackgroundModalInner = ({
  open,
  onClose,
  children,
  className,
  classes,
}: {
  open: boolean,
  onClose?: () => void,
  children: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="none"
      ModalClasses={{root: classes.modal}}
      BackdropProps={{className: classes.backdrop}}
      TransitionComponent={Fade}
    >
      {open &&
        <div className={classNames(classes.root, className)}>
          {children}
        </div>
      }
    </Popover>
  );
}

export const BlurredBackgroundModal = registerComponent(
  "BlurredBackgroundModal",
  BlurredBackgroundModalInner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    BlurredBackgroundModal: typeof BlurredBackgroundModal
  }
}
