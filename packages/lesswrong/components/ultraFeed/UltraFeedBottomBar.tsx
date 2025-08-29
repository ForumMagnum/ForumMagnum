import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ForumIcon from '../common/ForumIcon';
import { useDialog, OpenDialogContext } from '../common/withDialog';
import { useTracking } from '@/lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { userCanQuickTake } from '@/lib/vulcan-users/permissions';
import NewShortformDialog from '../shortform/NewShortformDialog';
import LWTooltip from '../common/LWTooltip';
import UltraFeedHistoryDialog from './UltraFeedHistoryDialog';

const FEED_TOP_SCROLL_OFFSET = 96;

const styles = defineStyles("UltraFeedBottomBar", (theme: ThemeType) => ({
  wrapper: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: theme.zIndexes.ultrafeedBottomBar,
    borderTop: `1px solid ${theme.palette.grey[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: theme.palette.panelBackground.bannerAdTranslucentHeavy, //theme.palette.background.default,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    '@media print': {
      display: 'none',
    },
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 24,
  },
  controlButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 4,
    cursor: 'pointer',
    color: theme.palette.grey[800],
    '&:hover': {
      opacity: 0.85,
    },
  },
  composerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    boxShadow: theme.palette.boxShadow.default,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.95,
      backgroundColor: theme.palette.primary.dark,
    },
    // '&:active': {
    //   transform: 'scale(0.98)',
    // },
  },
  label: {
    ...theme.typography.commentStyle,
    opacity: 0.8,
    fontSize: 10,
    display: 'none',
    
    lineHeight: '14px',
  },
  composerIcon: {
    fontSize: 32,
  },
  button: {
    padding: 8,
    borderRadius: 4,
    fontSize: 48,
    color: theme.palette.grey[700],
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
      color: theme.palette.grey[900],
    },
  },
  upArrow: {
    transform: 'rotate(90deg)',
  },
}));

const UltraFeedBottomBar = ({ refetchFeed, isTopVisible, isFeedInView, feedRootEl }: { refetchFeed: (() => void) | null, isTopVisible?: boolean, isFeedInView?: boolean, feedRootEl?: HTMLElement | null }) => {
  const classes = useStyles(styles);
  const { openDialog, closeDialog, isDialogOpen } = useDialog();
  const { captureEvent } = useTracking();
  const currentUser = useCurrentUser();
  
  const isAtTop = isTopVisible ?? (typeof window !== 'undefined' ? window.scrollY < 50 : true);

  const handleLeftButton = () => {
    if (isDialogOpen) {
      captureEvent('ultraFeedBottomBarBackClicked');
      closeDialog();
      return;
    }
    if (!isAtTop) {
      captureEvent('ultraFeedBottomBarScrollTopClicked');
      const targetTop = (() => {
        if (feedRootEl) {
          const rect = feedRootEl.getBoundingClientRect();
          return Math.max(0, rect.top + window.pageYOffset - FEED_TOP_SCROLL_OFFSET);
        }
        return 0;
      })();
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
      return;
    }
    // At top: Refresh
    captureEvent('ultraFeedBottomBarRefreshClicked');
    if (refetchFeed) {
      refetchFeed();
    }
  };

  const leftIconName = useMemo(() => {
    if (isDialogOpen) return 'ArrowLeft' as const;
    if (!isAtTop) return 'ArrowLeft' as const; // rotated via CSS
    return 'ArrowCircle' as const; // refresh symbol at top
  }, [isDialogOpen, isAtTop]);

  const handleOpenQuickTake = () => {
    if (!currentUser) return;
    captureEvent('ultraFeedComposerQuickTakeDialogOpened', { source: 'bottomBar' });
    openDialog({
      name: 'NewShortformDialog',
      contents: ({ onClose }) => {
        return <NewShortformDialog onClose={() => {
          onClose();
        }} />;
      },
    });
  };

  const handleOpenHistory = () => {
    captureEvent('ultraFeedBottomBarHistoryClicked');
    openDialog({
      name: 'UltraFeedHistoryDialog',
      contents: ({ onClose }) => {
        return <UltraFeedHistoryDialog onClose={() => {
          onClose();
        }} />;
      },
    });
  };


  if (!isFeedInView) {
    return null;
  }

  // portal needed to ensure renders above modals (z-index alone isn't enough)
  return createPortal(
    <div className={classes.wrapper}>
      <div className={classes.inner}>
        
        <LWTooltip title={isDialogOpen ? 'Back' : (isAtTop ? 'Refresh feed' : 'Return to top of feed')} placement="top">
          <div className={classes.controlButton} onClick={handleLeftButton}>
            <ForumIcon icon={leftIconName} className={`${classes.button} ${(!isDialogOpen && !isAtTop) ? classes.upArrow : ''}`} />
          </div>
        </LWTooltip>

        {userCanQuickTake(currentUser) && (
          <LWTooltip title="New Quick Take" placement="bottom">
            <div className={classes.composerButton} onClick={handleOpenQuickTake}>
              <ForumIcon icon="Plus" className={classes.composerIcon} />
            </div>
          </LWTooltip>
        )}

        <LWTooltip title="Your feed history" placement="bottom">
          <div className={classes.controlButton} onClick={handleOpenHistory}>
            <ForumIcon icon="Clock" className={classes.button} />
            <span className={classes.label}>History</span>
          </div>
        </LWTooltip>

      </div>
    </div>,
    document.body
  );
};

export default UltraFeedBottomBar;


