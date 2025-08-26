import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import type { ObservableQuery } from '@apollo/client';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { FeedItemSourceType } from './ultraFeedTypes';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { MixedTypeFeed } from "../common/MixedTypeFeed";
import UltraFeedPostItem from "./UltraFeedPostItem";
import FeedItemWrapper from "./FeedItemWrapper";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import SettingsButton from "../icons/SettingsButton";
import UltraFeedSpotlightItem from "./UltraFeedSpotlightItem";
import UltraFeedSettings from "./UltraFeedSettings";
import UltraFeedThreadItem from "./UltraFeedThreadItem";
import { UltraFeedQuery } from '../common/feeds/feedQueries';
import ForumIcon from '../common/ForumIcon';
import UltraFeedQuickTakeDialog from './UltraFeedQuickTakeDialog';
import { useDialog } from '../common/withDialog';
import FeedSelectorDropdown from '../common/FeedSelectorCheckbox';
import { ultraFeedEnabledSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import AnalyticsInViewTracker from '../common/AnalyticsInViewTracker';
import SuggestedFeedSubscriptions from '../subscriptions/SuggestedFeedSubscriptions';


const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  root: {
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
  settingsContainerExternal: {
    marginTop: 16,
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

const UltraFeedContent = ({
  alwaysShow = false,
  hideTitle = false,
  settingsVisible,
  onSettingsToggle,
}: {
  alwaysShow?: boolean
  hideTitle?: boolean
  settingsVisible?: boolean
  onSettingsToggle?: () => void
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [internalSettingsVisible, setInternalSettingsVisible] = useState(false);

  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const { settings, updateSettings, resetSettings, truncationMaps } = useUltraFeedSettings();
  const [sessionId] = useState<string>(randomId);
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);
  
  const isControlled = settingsVisible !== undefined;
  const actualSettingsVisible = isControlled ? settingsVisible : internalSettingsVisible;

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
    captureEvent("ultraFeedSettingsToggled", { open: !actualSettingsVisible });
    if (isControlled) {
      onSettingsToggle?.();
    } else {
      setInternalSettingsVisible(!internalSettingsVisible);
    }
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
            {!hideTitle && (
              <SectionTitle title={customTitle} titleClassName={classes.sectionTitle}>
                <div className={classes.feedCheckboxAndSettingsContainer}>
                {!alwaysShow && <FeedSelectorDropdown currentFeedType="new" />}
                {!isControlled && (
                  <div className={classes.settingsButtonContainer}>
                    <SettingsButton 
                      showIcon={true}
                      onClick={toggleSettings}
                    />
                  </div>
                )}
              </div>
              </SectionTitle>
            )}

            {actualSettingsVisible && (
              <div className={isControlled ? classes.settingsContainerExternal : classes.settingsContainer}>
                <UltraFeedSettings 
                  settings={settings}
                  updateSettings={updateSettings}
                  resetSettingsToDefault={resetSettingsToDefault}
                  onClose={() => isControlled ? onSettingsToggle?.() : setInternalSettingsVisible(false)} 
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
                  },
                  feedSubscriptionSuggestions: {
                    render: (item: FeedSubscriptionSuggestionsFragment, index?: number) => {
                      if (!item || !item.suggestedUsers) {
                        return null;
                      }
                      
                      return (
                        <FeedItemWrapper>
                          <SuggestedFeedSubscriptions suggestedUsers={item.suggestedUsers} />
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

const UltraFeed = ({
  alwaysShow = false,
  hideTitle = false,
  settingsVisible,
  onSettingsToggle,
}: {
  alwaysShow?: boolean
  hideTitle?: boolean
  settingsVisible?: boolean
  onSettingsToggle?: () => void
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return null;
  }

  if (!ultraFeedEnabledSetting.get()) {
    return (
      <SingleColumnSection>
        <div className={classes.disabledMessage}>
          The New Feed is currently disabled.
        </div>
      </SingleColumnSection>
    );
  }

  return (
    <>
      <DeferRender ssr={false}>
        <UltraFeedContent 
          alwaysShow={alwaysShow}
          hideTitle={hideTitle}
          settingsVisible={settingsVisible}
          onSettingsToggle={onSettingsToggle}
        />
      </DeferRender>
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
