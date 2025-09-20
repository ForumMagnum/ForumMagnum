import React, { useMemo } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ForumIcon from '../common/ForumIcon';
import { useDialog } from '../common/withDialog';
import { useTracking } from '@/lib/analyticsEvents';
import LWTooltip from '../common/LWTooltip';
import { getFeedScrollTargetTop } from './ultraFeedHelpers';

const styles = defineStyles("UltraFeedBottomBar", (theme: ThemeType) => ({
  wrapper: {
    position: 'fixed',
    right: 80,
    bottom: 20,
    zIndex: theme.zIndexes.ultrafeedBottomBar,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    '@media print': {
      display: 'none',
    },
    transition: 'all 0.2s ease-in-out',
  },
  composerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: 48,
    height: 48,
    padding: 10,
    cursor: 'pointer',
    boxShadow: `0 1px 6px 0 ${theme.palette.greyAlpha(0.06)}, 0 2px 32px 0 ${theme.palette.greyAlpha(0.16)}`,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      // boxShadow: `0 6px 8px ${theme.palette.greyAlpha(0.2)}`,
      width: 52,
      height: 52,
      padding: 14,
    },
    ...(theme.palette.intercom ? {
      color: theme.palette.text.alwaysBlack,
      backgroundColor: theme.palette?.intercom?.buttonBackground ?? theme.palette.grey[100],
    } : {
      backgroundColor: theme.palette.grey[100],
    })
  },
  composerIcon: {
    width: 24,
    height: 24,
  },
  upArrow: {
    transform: 'rotate(90deg)',
  },
}));

const UltraFeedBottomBar = ({ refetchFeed, isTopVisible, feedRootEl }: { refetchFeed: (() => void) | null, isTopVisible?: boolean, feedRootEl?: HTMLElement | null }) => {
  const classes = useStyles(styles);
  const { closeDialog, isDialogOpen } = useDialog();
  const { captureEvent } = useTracking();
  
  const isAtTop = isTopVisible ?? (typeof window !== 'undefined' ? window.scrollY < 50 : true);

  const handleLeftButton = () => {
    if (isDialogOpen) {
      captureEvent('ultraFeedBottomBarBackClicked');
      closeDialog();
      return;
    }
    if (!isAtTop) {
      captureEvent('ultraFeedBottomBarScrollTopClicked');
      window.scrollTo({ top: getFeedScrollTargetTop(feedRootEl ?? null), behavior: 'smooth' });
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
    return 'Autorenew' as const; // refresh symbol at top
  }, [isDialogOpen, isAtTop]);

  return (
    <div className={classes.wrapper}>
      <LWTooltip title={isDialogOpen ? 'Back' : (isAtTop ? 'Refresh feed' : 'Return to top of feed')} placement="left">
        <div className={classes.composerButton} onClick={handleLeftButton}>
          <ForumIcon icon={leftIconName} className={classNames(classes.composerIcon, (!isDialogOpen && !isAtTop) && classes.upArrow)} />
        </div>
      </LWTooltip>
    </div>
  );
};

export default UltraFeedBottomBar;


