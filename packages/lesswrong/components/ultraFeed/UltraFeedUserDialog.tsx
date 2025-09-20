import React, { useState } from 'react';
import qs from 'qs';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWDialog from '../common/LWDialog';
import { DialogContent } from '../widgets/DialogContent';
import ForumIcon from '../common/ForumIcon';
import UltraFeedUserCard from '../ultraFeed/UltraFeedUserCard';
import { useDialogNavigation } from '../hooks/useDialogNavigation';
import { useDisableBodyScroll } from '../hooks/useDisableBodyScroll';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import FollowUserButton from '../users/FollowUserButton';
import { useCurrentUserId } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import UserActionsButton from '../dropdowns/users/UserActionsButton';
import { UltraFeedContextProvider } from './UltraFeedContextProvider';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';

const styles = defineStyles("UltraFeedUserDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    '&:first-child': {
      paddingTop: 0,
    },
  },
  dialogPaper: {
    width: '600px',
    maxWidth: '90vw',
    height: '80vh',
    maxHeight: '80vh',
    margin: '50px auto',
    borderRadius: 8,
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
      maxWidth: '100vw',
      height: '100dvh',
      maxHeight: '100dvh',
      margin: 0,
      borderRadius: 0,
    },
  },
  header: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderBottom: theme.palette.border.faint,
    zIndex: theme.zIndexes.header,
    padding: '8px 12px',
    flexShrink: 0,
    borderRadius: '8px 8px 0 0',
    [theme.breakpoints.down('sm')]: {
      borderRadius: 0,
    },
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.body1,
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '@keyframes fadeInHeader': {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 0.8,
    },
  },
  headerUserInfo: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flex: 1,
    opacity: 0.9,
    animation: 'fadeInHeader 0.3s ease-in-out',
  },
  headerUsername: {
    position: 'relative',
    ...theme.typography.postStyle,
    fontSize: '1.4em',
    fontWeight: 600,
    color: theme.palette.text.primary,
    textDecoration: 'none',
    '&:hover': {
      opacity: 0.8,
    },
  },
  headerFollowButton: {
    marginLeft: 'auto',
  },
  headerButtonsContainer: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  closeButton: {
    width: 36,
    height: 36,
    color: theme.palette.grey[900],
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    padding: 6,
    cursor: 'pointer',
    fontSize: 36,
    fontWeight: 'bold',
    '&:hover': {
      color: theme.palette.grey[900],
      backgroundColor: theme.palette.grey[300],
    },
    '& svg': {
      display: 'block',
      strokeWidth: 4.5,
    },
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%',
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
    borderRadius: 0,
  },
  modalWrapper: {
    zIndex: `${theme.zIndexes.ultrafeedModal} !important`,
  },
}));

const UltraFeedUserDialog = ({ 
  user, 
  onClose 
}: {
  user: UsersMinimumInfo;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  
  const currentUserId = useCurrentUserId();
  const [nameHidden, setNameHidden] = useState(false);
  const { settings } = useUltraFeedSettings();
  const incognitoMode = settings.resolverSettings.incognitoMode;
  
  const profileUrl = user ? `${userGetProfileUrl(user)}?${qs.stringify({ from: 'feedModal' })}` : undefined;
  useDialogNavigation(onClose, profileUrl);
  useDisableBodyScroll();

  const handleNameVisibilityChange = (isHidden: boolean) => {
    setNameHidden(isHidden);
  };

  return (
    <UltraFeedContextProvider openInNewTab={true}>
    <UltraFeedObserverProvider incognitoMode={incognitoMode}>
    <OverflowNavObserverProvider>
      <LWDialog
        open={true}
        onClose={onClose}
        fullWidth
        className={classes.modalWrapper}
        paperClassName={classes.dialogPaper}
      >
        <DialogContent className={classes.dialogContent}>
          <div className={classes.header}>
            <div className={classes.headerLeft}>
              <ForumIcon
                icon="ArrowLeft"
                onClick={onClose}
                className={classes.closeButton}
              />
              {nameHidden && (
                <div className={classes.headerUserInfo}>
                  <Link to={userGetProfileUrl(user)} className={classes.headerUsername}>
                    {user.displayName}
                  </Link>
                  <div className={classes.headerButtonsContainer}>
                    {currentUserId !== user._id && (
                      <UserActionsButton 
                        user={user} 
                        from="ultraFeedModal"
                        placement="bottom-end"
                      />
                    )}
                    <FollowUserButton user={user} styleVariant="ultraFeed" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={classes.contentWrapper}>
            <div className={classes.cardWrapper}>
              <UltraFeedUserCard 
                user={user} 
                inModal={true} 
                onNameVisibilityChange={handleNameVisibilityChange}
              />
            </div>
          </div>
        </DialogContent>
      </LWDialog>
    </OverflowNavObserverProvider>
    </UltraFeedObserverProvider>
    </UltraFeedContextProvider>
  );
};

export default UltraFeedUserDialog;


