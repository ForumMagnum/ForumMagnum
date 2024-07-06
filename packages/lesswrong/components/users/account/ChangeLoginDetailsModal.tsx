import { Components, registerComponent } from "@/lib/vulcan-lib";
import React, { useState } from "react";

// TODO maybe delete if I reuse the login popover a lot
const styles = (theme: ThemeType): JssStyles => ({
  datePickers: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: "8px",
    padding: '24px 24px 16px 24px',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    }
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 24px 12px 24px',
    gap: "8px",
  }
});

const ChangeLoginDetailsModal = ({
  onClose,
  classes,
}: {
  onClose?: () => void;
  classes: ClassesType;
}) => {
  const { LWDialog } = Components;

  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      Modal
    </LWDialog>
  );
};

const ChangeLoginDetailsModalComponent = registerComponent("ChangeLoginDetailsModal", ChangeLoginDetailsModal, { styles });

declare global {
  interface ComponentTypes {
    ChangeLoginDetailsModal: typeof ChangeLoginDetailsModalComponent;
  }
}
