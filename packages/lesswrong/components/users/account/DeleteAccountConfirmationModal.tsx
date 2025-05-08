import React, { useState } from 'react';
import { DialogContent } from "@/components/widgets/DialogContent";
import { isFriendlyUI } from '@/themes/forumTheme';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { Link } from '@/lib/reactRouterWrapper';
import { ACCOUNT_DELETION_COOLING_OFF_DAYS } from '@/lib/collections/users/helpers';
import { useMessages } from '@/components/common/withMessages';

const styles = (theme: ThemeType) => ({
  dialogPaper: {
    maxWidth: 500,
  },
  close: {
    position: "absolute",
    right: 12,
    top: 12,
    cursor: "pointer",
    "& svg": {
      color: theme.palette.grey[600],
      width: 20,
    },
  },
  header: {
    marginTop: 0,
    fontSize: 24
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[800]
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    float: 'right',
  },
  link: {
    color: theme.palette.primary.main
  }
});

const DeleteAccountConfirmationModalInner = ({onClose, confirmAction, classes}: {
  onClose: () => void,
  confirmAction: () => Promise<void>,
  classes: ClassesType<typeof styles>,
}) => {
  const {LWDialog, EAButton, Loading, Typography} = Components;
  const [loading, setLoading] = useState(false);
  const { flash } = useMessages();

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      maxWidth={isFriendlyUI ? "md" : "sm"}
      dialogClasses={{ paper: classes.dialogPaper }}
    >
      <DialogContent>
        <Typography variant="display2" className={classes.header}>
          Confirm account deletion
        </Typography>
        <p className={classes.text}>
          Your account will be deactivated, and you will be unsubscribed from the Forum Digest. You will be able to log
          in and reverse this within <b>{ACCOUNT_DELETION_COOLING_OFF_DAYS} days</b>, after which your account and any
          associated data will be permanently deleted from our servers.
        </p>
        <p className={classes.text}>
          Note: By default your posts and comments will remain and be listed as '[Anonymous]', please{" "}
          <Link className={classes.link} to="/contact" target="_blank" rel="noopener noreferrer">
            contact us
          </Link>{" "}
          if you would like these to be removed.
        </p>
        <div className={classes.buttonRow}>
          <EAButton variant="outlined" onClick={onClose}>
            Cancel
          </EAButton>
          <EAButton
            onClick={async () => {
              setLoading(true);
              try {
                await confirmAction();
              } catch (e) {
                flash(e.message)
              } finally {
                setLoading(false);
                onClose();
              }
            }}
          >
            {loading ? <Loading /> : "Confirm"}
          </EAButton>
        </div>
      </DialogContent>
    </LWDialog>
  );
}

export const DeleteAccountConfirmationModal = registerComponent(
  'DeleteAccountConfirmationModal',
  DeleteAccountConfirmationModalInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    DeleteAccountConfirmationModal: typeof DeleteAccountConfirmationModal
  }
}
