import React, { useState, useCallback, useEffect } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWDialog from '../common/LWDialog';
import { DialogContent } from '../widgets/DialogContent';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { UltraFeedHistoryQuery } from '../common/feeds/feedQueries';
import FeedItemWrapper from './FeedItemWrapper';
import UltraFeedThreadItem from './UltraFeedThreadItem';
import UltraFeedPostItem from './UltraFeedPostItem';
import UltraFeedSpotlightItem from './UltraFeedSpotlightItem';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import { FeedItemSourceType } from './ultraFeedTypes';
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import ForumIcon from '../common/ForumIcon';
import BookmarksFeed from '../bookmarks/BookmarksFeed';
import { createUltraFeedRenderers } from './renderers/createUltraFeedRenderers';
import { useDisableBodyScroll } from '../hooks/useDisableBodyScroll';

const styles = defineStyles("UltraFeedHistoryDialog", (theme: ThemeType) => ({
  modalWrapper: {
    zIndex: `${theme.zIndexes.ultrafeedModalHeader + 1} !important`,
  },
  dialogPaper: {
    width: `${SECTION_WIDTH + 48}px`,
    maxWidth: 'calc(100vw - 48px)',
    height: 'calc(100vh - 96px)',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    minHeight: '100%',
    backgroundColor: theme.palette.background.default,
    '&:first-child': {
      paddingTop: 0,
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
    position: 'sticky',
    top: 0,
    borderRadius: '8px 8px 0 0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  headerTitle: {
    ...theme.typography.body1,
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  headerTabs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    flex: 1,
  },
  tabsBar: {
    display: 'flex',
    width: '100%',
  },
  tabButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 600,
    padding: '12px 0',
    width: '50%',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  tabButtonInactive: {
    color: theme.palette.grey[500],
  },
  tabButtonActive: {
    color: theme.palette.text.primary,
  },
  tabLabel: {
    position: 'relative',
    top: 2,
    display: 'inline-flex',
    flexDirection: 'column',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -16,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px 3px 0 0',
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
  contentPadding: {
    padding: 16,
  },
  contentContainer: {
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16,
    maxWidth: SECTION_WIDTH,
    width: '100%',
  },
}));

const UltraFeedHistoryDialog = ({ onClose }: { onClose: () => void }) => {
  const classes = useStyles(styles);
  const { settings } = useUltraFeedSettings();
  const { captureEvent } = useTracking();
  const [activeTab, setActiveTab] = useState<'history'|'bookmarks'>('history');
  
  const setHistory = useCallback(() => {
    if (activeTab !== 'history') {
      captureEvent('ultraFeedHistoryTabSwitched', { from: activeTab, to: 'history' });
      setActiveTab('history');
    }
  }, [activeTab, captureEvent]);
  
  const setBookmarks = useCallback(() => {
    if (activeTab !== 'bookmarks') {
      captureEvent('ultraFeedHistoryTabSwitched', { from: activeTab, to: 'bookmarks' });
      setActiveTab('bookmarks');
    }
  }, [activeTab, captureEvent]);

  const handleClose = useCallback(() => {
    captureEvent('ultraFeedHistoryDialogClosed', { activeTab });
    onClose();
  }, [activeTab, captureEvent, onClose]);

  // Track when dialog is opened
  useEffect(() => {
    captureEvent('ultraFeedHistoryDialogOpened', { initialTab: activeTab });
  }, [captureEvent, activeTab]);

  useDisableBodyScroll();

  return (
    <AnalyticsContext pageSectionContext="ultraFeedHistoryDialog">
      <UltraFeedObserverProvider incognitoMode={true}>
        <OverflowNavObserverProvider>
          <LWDialog
            open={true}
            onClose={handleClose}
            className={classes.modalWrapper}
            paperClassName={classes.dialogPaper}
          >
            <DialogContent className={classes.dialogContent}>
              <div className={classes.header}>
                <div className={classes.headerLeft}>
                  <ForumIcon
                    icon="ArrowLeft"
                    className={classes.closeButton}
                    onClick={handleClose}
                  />
                </div>
                <div className={classes.headerTabs}>
                  <div
                    className={`${classes.tabButton} ${activeTab === 'history' ? classes.tabButtonActive : classes.tabButtonInactive}`}
                    onClick={setHistory}
                  >
                    <div className={classes.tabLabel}>
                      History
                      {activeTab === 'history' && (
                        <div className={classes.tabUnderline} />
                      )}
                    </div>
                  </div>
                  <div
                    className={`${classes.tabButton} ${activeTab === 'bookmarks' ? classes.tabButtonActive : classes.tabButtonInactive}`}
                    onClick={setBookmarks}
                  >
                    <div className={classes.tabLabel}>
                      Bookmarks
                      {activeTab === 'bookmarks' && (
                        <div className={classes.tabUnderline} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className={classes.contentContainer}>
                {activeTab === 'history' && (
                  <AnalyticsContext pageSectionContext="ultraFeedViewHistory">
                    <MixedTypeFeed
                      query={UltraFeedHistoryQuery}
                      variables={{}}
                      firstPageSize={20}
                      pageSize={30}
                      fetchPolicy="network-only"
                      renderers={createUltraFeedRenderers({ settings })}
                    />
                  </AnalyticsContext>
                )}
                {activeTab === 'bookmarks' && (
                  <BookmarksFeed hideTitle={true} />
                )}
              </div>
            </DialogContent>
          </LWDialog>
        </OverflowNavObserverProvider>
      </UltraFeedObserverProvider>
    </AnalyticsContext>
  );
};

export default UltraFeedHistoryDialog;


