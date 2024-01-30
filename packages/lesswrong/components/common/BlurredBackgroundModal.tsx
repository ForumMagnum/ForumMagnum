import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import Popover from "@material-ui/core/Popover";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.modalBackground,
    borderRadius: theme.borderRadius.default,
    maxWidth: "100%",
    padding: 32,
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
});

export const BlurredBackgroundModal = ({
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
    >
      {open &&
        <div className={classNames(classes.root, className)}>
          {children}
        </div>
      }
    </Popover>
  );
}

const BlurredBackgroundModalComponent = registerComponent(
  "BlurredBackgroundModal",
  BlurredBackgroundModal,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    BlurredBackgroundModal: typeof BlurredBackgroundModalComponent
  }
}
