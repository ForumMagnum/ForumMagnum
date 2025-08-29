import React, { useState, useRef } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { randomId } from '@/lib/random';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { ObservableQuery } from '@apollo/client';
import { UltraFeedQuery } from '../common/feeds/feedQueries';
import ForumIcon from '../common/ForumIcon';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import SectionTitle from '../common/SectionTitle';
import SingleColumnSection from '../common/SingleColumnSection';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import SettingsButton from '../icons/SettingsButton';
import FeedItemWrapper from './FeedItemWrapper';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import UltraFeedPostItem from './UltraFeedPostItem';
import UltraFeedQuickTakeDialog from './UltraFeedQuickTakeDialog';
import UltraFeedSettings from './UltraFeedSettings';
import UltraFeedThreadItem from './UltraFeedThreadItem';
import FeedSelectorDropdown from '../common/FeedSelectorCheckbox';
import UltraFeedSpotlightItem from './UltraFeedSpotlightItem';
import AnalyticsInViewTracker from '../common/AnalyticsInViewTracker';
import { Link } from '@/lib/reactRouterWrapper';
import useUltraFeedSettings from '../hooks/useUltraFeedSettings';
import type { FeedItemSourceType } from './ultraFeedTypes';

const styles = defineStyles("UltraFeedContent", (theme: ThemeType) => ({
  root: {
    // Remove padding inserted by Layout.tsx to be flush with sides of screen
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
  feedComementItem: {
    marginBottom: 16
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'center',
    color: theme.palette.text.bannerAdOverlay,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 8,
    },
  },
  titleText: {
  },
  titleTextDesktop: {
    display: 'inline',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  titleTextMobile: {
    display: 'none',
    marginLeft: 8,
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    },
  },
  feedCheckboxAndSettingsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // gap: 24, // Add spacing between items
  },
  settingsButtonContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  ultraFeedNewContentContainer: {
  },
  settingsContainer: {
    marginBottom: 32,
  },
  composerButton: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      position: 'fixed',
      bottom: 18,
      right: 18,
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme.palette.boxShadow.default,
      cursor: 'pointer',
      zIndex: theme.zIndexes.intercomButton,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
    },
  },
  composerIcon: {
    fontSize: 24,
  },
  disabledMessage: {
    textAlign: 'center',
    padding: 40,
    ...theme.typography.body1,
    color: theme.palette.text.dim,
  },
  titleLink: {
    color: 'inherit',
    '&:hover': {
      color: 'inherit',
      opacity: 0.8,
    },
  },
}));

const UltraFeedContent = ({alwaysShow = false}: {
  alwaysShow?: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const { settings, updateSettings, resetSettings, truncationMaps } = useUltraFeedSettings();
  const [sessionId] = useState<string>(randomId);
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);

  const handleOpenQuickTakeDialog = () => {
    captureEvent("ultraFeedComposerQuickTakeDialogOpened");
    openDialog({
      name: "UltraFeedQuickTakeDialog",
      contents: ({onClose}) => <UltraFeedQuickTakeDialog onClose={onClose} currentUser={currentUser} />
    });
  };

  if (!currentUser) {
    return null;
  }

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    captureEvent("ultraFeedSettingsToggled", { open: !settingsVisible });
    setSettingsVisible(!settingsVisible);
  };
  
  const resetSettingsToDefault = () => {
    resetSettings();
  };

  const { resolverSettings } = settings;
  
  const customTitle = <>
    <div className={classes.titleContainer}>
      <span className={classes.titleText}>
        <Link to="/feed" className={classes.titleLink}>
          Update Feed
        </Link>
      </span>
    </div>
  </>;

  return (
    <AnalyticsContext pageSectionContext="ultraFeed" ultraFeedContext={{ feedSessionId: sessionId }}>
      <AnalyticsInViewTracker eventProps={{inViewType: "ultraFeed"}}>
      <div className={classes.root}>
        <UltraFeedObserverProvider incognitoMode={resolverSettings.incognitoMode}>
        <OverflowNavObserverProvider>
          <SingleColumnSection>
            <SectionTitle title={customTitle} titleClassName={classes.sectionTitle}>
              <div className={classes.feedCheckboxAndSettingsContainer}>
              {!alwaysShow && <FeedSelectorDropdown currentFeedType="new" />}
              <div className={classes.settingsButtonContainer}>
                <SettingsButton 
                  showIcon={true}
                  onClick={toggleSettings}
                />
              </div>
            </div>
            </SectionTitle>

            {settingsVisible && (
              <div className={classes.settingsContainer}>
                <UltraFeedSettings 
                  settings={settings}
                  updateSettings={updateSettings}
                  resetSettingsToDefault={resetSettingsToDefault}
                  onClose={() => setSettingsVisible(false)} 
                  truncationMaps={truncationMaps}
                />
              </div>
            )}
            
            <div className={classes.ultraFeedNewContentContainer}>
              <MixedTypeFeed
                query={UltraFeedQuery}
                variables={{
                  sessionId,
                  settings: JSON.stringify(resolverSettings),
                }}
                firstPageSize={15}
                pageSize={30}
                refetchRef={refetchSubscriptionContentRef}
                loadMoreDistanceProp={1000}
                fetchPolicy="cache-first"
                renderers={{
                  feedCommentThread: {
                    render: (item: FeedCommentThreadFragment, index: number) => {
                      if (!item) {
                        return null;
                      }
                      
                      const thread = {
                        ...item,
                        postSources: item.postSources as FeedItemSourceType[] | null
                      };
                      
                      return (
                        <FeedItemWrapper>
                          <UltraFeedThreadItem
                            thread={thread}
                            settings={settings}
                            index={index}
                          />
                        </FeedItemWrapper>
                      );
                    }
                  },
                  feedPost: {
                    render: (item: FeedPostFragment, index: number) => {
                      if (!item) {
                        return null;
                      }
                      
                      return (
                        <FeedItemWrapper>
                          <UltraFeedPostItem
                            post={item.post}
                            postMetaInfo={item.postMetaInfo}
                            settings={settings}
                            index={index} 
                          />
                        </FeedItemWrapper>
                      );
                    }
                  },
                  feedSpotlight: {
                    render: (item: FeedSpotlightFragment, index: number) => {
                      const { spotlight, post, spotlightMetaInfo } = item;
                      if (!spotlight) {
                        return null;
                      }

                      const metaInfo = spotlightMetaInfo ? {
                        ...spotlightMetaInfo,
                        sources: spotlightMetaInfo.sources as FeedItemSourceType[]
                      } : undefined;

                      return (
                        <FeedItemWrapper>
                          <UltraFeedSpotlightItem 
                            spotlight={spotlight}
                            post={post ?? undefined}
                            spotlightMetaInfo={metaInfo}
                            showSubtitle={true}
                            index={index}
                          />
                        </FeedItemWrapper>
                      );
                    }
                  }
                }}
              />
            </div>
          </SingleColumnSection>
        </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
        
        {userIsAdminOrMod(currentUser) && (
          <div className={classes.composerButton} onClick={handleOpenQuickTakeDialog}>
            <ForumIcon icon="Plus" className={classes.composerIcon} />
          </div>
        )}
      </div>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  );
};

export default UltraFeedContent;
