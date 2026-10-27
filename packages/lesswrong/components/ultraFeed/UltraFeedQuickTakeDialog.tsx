import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWDialog from '../common/LWDialog';
import { DialogContent } from '../widgets/DialogContent';
import ForumIcon from '../common/ForumIcon';
import QuickTakesEntry from '../quickTakes/QuickTakesEntry';
import { useDisableBodyScroll } from '../hooks/useDisableBodyScroll';
import { useVisualViewportRect } from '../hooks/useVisualViewportRect';

const styles = defineStyles("UltraFeedQuickTakeDialog", (theme: ThemeType) => ({
  dialogPaper: {
    overflow: 'hidden',
  },
  visibleArea: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  dialogContent: {
    padding: '0 !important',
    overflowY: 'auto',
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
  formWrapper: {
    padding: 16,
    borderRadius: 0,
    '& .form-component-EditorFormComponent': {
      marginTop: 0,
      marginBottom: 12,
      borderRadius: 4,
      '--lexical-comment-min-height': '150px',
    },
  },
}));

type UltraFeedQuickTakeDialogProps = {
  onClose: () => void;
  currentUser: UsersCurrent | null;
}

const UltraFeedQuickTakeDialog = ({ onClose, currentUser }: UltraFeedQuickTakeDialogProps) => {
  const classes = useStyles(styles);
  const visualViewportRect = useVisualViewportRect();

  useDisableBodyScroll();

  const visibleAreaStyle = visualViewportRect
    ? { height: visualViewportRect.height, transform: `translateY(${visualViewportRect.offsetTop}px)` }
    : undefined;

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullScreen
      maxWidth={false}
      disableBackdropClick
      backdrop="none"
      paperClassName={classes.dialogPaper}
    >
      <div className={classes.visibleArea} style={visibleAreaStyle}>
        <div className={classes.stickyHeader}>
          <ForumIcon
            icon="Close"
            onClick={onClose}
            className={classes.closeButton}
          />
          <div className={classes.headerTitle}>New quick take</div>
        </div>
        <DialogContent className={classes.dialogContent}>
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
      </div>
    </LWDialog>
  );
};

export default UltraFeedQuickTakeDialog;
