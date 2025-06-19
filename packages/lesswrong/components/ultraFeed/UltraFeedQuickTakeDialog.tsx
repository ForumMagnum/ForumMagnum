import React, { useEffect } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWDialog from '../common/LWDialog';
import { DialogContent } from '../widgets/DialogContent';
import ForumIcon from '../common/ForumIcon';
import QuickTakesEntry from '../quickTakes/QuickTakesEntry';

const styles = defineStyles("UltraFeedQuickTakeDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: '0 !important',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  stickyHeader: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    flexShrink: 0,
    backgroundColor: theme.palette.ultrafeedModalHeader.background,
    borderBottom: theme.palette.border.faint,
    borderRadius: '12px 12px 0 0',
    zIndex: 1,
    padding: '12px 20px',
    [theme.breakpoints.down('sm')]: {
      padding: '4px 12px',
      height: 56,
    }
  },
  headerTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    margin: '0 auto',
    paddingRight: 36, // to center title, account for close button width
  },
  closeButton: {
    width: 36,
    height: 36,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    padding: 6,
    cursor: 'pointer',
    fontSize: 36,
    '&:hover': {
      color: theme.palette.grey[700],
    },
    '& svg': {
      display: 'block',
    }
  },
  dialogPaper: {
    width: '100vw',
    margin: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  formWrapper: {
    maxHeight: '50%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    '& .EditorFormComponent-commentEditorHeight .ck.ck-content': {
      minHeight: '50dvh',
      maxHeight: '50dvh',
    }
  },
}));

type UltraFeedQuickTakeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UsersCurrent | null;
}

const UltraFeedQuickTakeDialog = ({ isOpen, onClose, currentUser }: UltraFeedQuickTakeDialogProps) => {
  const classes = useStyles(styles);

  // Disable background scroll while dialog open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <LWDialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.dialogContent}>
        <div className={classes.stickyHeader}>
          <ForumIcon
            icon="Close"
            onClick={onClose}
            className={classes.closeButton}
          />
          <div className={classes.headerTitle}>New quick take</div>
        </div>
        <QuickTakesEntry
          currentUser={currentUser}
          successCallback={onClose}
          className={classes.formWrapper}
          cancelCallback={onClose}
          defaultExpanded={true}
          defaultFocus={true}
          submitButtonAtBottom={true}
        />
      </DialogContent>
    </LWDialog>
  );
};

export default UltraFeedQuickTakeDialog;
