import React, { useCallback, useRef, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE } from '../../lib/cookies/cookies';
import { userHasUltraFeed } from '../../lib/betas';
import type { ObservableQuery } from '@apollo/client';
import classNames from 'classnames';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedObserverProvider } from './UltraFeedObserver';

// Add this at the top level of your file


const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  root: {
    // Remove padding inserted by Layout.tsx to be flush with sides of screen
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  settingsButton: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    '&:hover': {
      opacity: 0.8
    }
  },
  feedComementItem: {
    marginBottom: 16
  },
  sectionTitle: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    display: 'flex',
    flex: '1 1 0',
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    minHeight: 24,
    '&:hover': {
      opacity: 0.8
    }
  },
  titleText: {
    // No custom styling to preserve original appearance
  },
  titleTextDesktop: {
    display: 'inline',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  titleTextMobile: {
    display: 'none',
    marginLeft: 12,
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    },
  },
  refreshText: {
    color: theme.palette.primary.dark,
    fontSize: '1.3rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
    pointerEvents: 'none',
    marginRight: -60,
    whiteSpace: 'nowrap', // Prevent text from wrapping
  },
  settingsButtonContainer: {
    flex: '1 1 0',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8
  },
  ultraFeedNewContentContainer: {
  },
  settingsContainer: {
    marginBottom: 20,
    background: theme.palette.panelBackground.default,
    borderRadius: 3,
    padding: '16px 12px',
    boxShadow: theme.palette.boxShadow.default,
  },
}));

// Define the main component implementation
const UltraFeedContent = () => {
  const classes = useStyles(styles);
  const { SectionFooterCheckbox, MixedTypeFeed, UltraFeedPostItem,
    FeedItemWrapper, SectionTitle, SingleColumnSection, SettingsButton, 
    SpotlightFeedItem, UltraFeedSettings, UltraFeedThreadItem } = Components;
  
  const currentUser = useCurrentUser();
  const [ultraFeedCookie, setUltraFeedCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  const ultraFeedEnabled = ultraFeedCookie[ULTRA_FEED_ENABLED_COOKIE] === "true";
  
  const [settingsVisible, setSettingsVisible] = useState(false);
  // Generate a new session ID for each component mount
  const [sessionId] = useState(() => randomId());
  
  // Ref for the top section to scroll to
  const topSectionRef = useRef<HTMLDivElement>(null);

  // Setup refetch for subscribed content
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);

  if (!userHasUltraFeed(currentUser)) {
    return null;
  }

  const toggleUltraFeed = () => {
    setUltraFeedCookie(ULTRA_FEED_ENABLED_COOKIE, String(!ultraFeedEnabled), { path: "/" });
  };

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSettingsVisible(!settingsVisible);
  };
  
  const customTitle = <>
    <div className={classes.titleContainer}>
      <span className={classes.titleText}>
        <span className={classes.titleTextDesktop}>Update Feed</span>
        <span className={classes.titleTextMobile}>The Feed</span>
      </span>
    </div>
    <div className={classes.settingsButtonContainer}>
      <SettingsButton 
        showIcon={true}
        onClick={toggleSettings}
      />
    </div>
  </>;

  return (
    <div className={classes.root}>
      <div className={classes.toggleContainer}>
        <SectionFooterCheckbox 
          value={ultraFeedEnabled} 
          onClick={toggleUltraFeed} 
          label="Use UltraFeed"
          tooltip="Hide Quick Takes and Popular Comments sections and show a feed of posts and comments from users you subscribe to"
        />
      </div>
      
      {ultraFeedEnabled && <>
        <UltraFeedObserverProvider>
          <SingleColumnSection>
            {/* place this higher than top feed so it properly scrolls into view */}
            <div ref={topSectionRef} />
            <SectionTitle title={customTitle} titleClassName={classes.sectionTitle} />
            
            {/* Settings Drawer */}
            {settingsVisible && (
              <div className={classes.settingsContainer}>
                <UltraFeedSettings onClose={() => setSettingsVisible(false)} />
              </div>
            )}
            
            {/* New Content Section */}
            <div className={classes.ultraFeedNewContentContainer}>
              <MixedTypeFeed
                resolverName="UltraFeed"
                sortKeyType="Date"
                firstPageSize={15}
                pageSize={15}
                refetchRef={refetchSubscriptionContentRef}
                resolverArgsValues={{ sessionId }}
                renderers={{
                    feedCommentThread: {
                      fragmentName: 'FeedCommentThreadFragment',
                      render: (item: FeedCommentThreadFragment) => {
                        if (!item) {
                          return null;
                        }
                        
                        return (
                          <FeedItemWrapper sources={['commentThreads']}>
                            <UltraFeedThreadItem thread={item} />
                          </FeedItemWrapper>
                        );
                      }
                    },
                    feedPost: {
                      fragmentName: 'FeedPostFragment',
                      render: (item: FeedPostFragment) => {
                        if (!item) {
                          return null;
                        }
                        
                        return (
                          <FeedItemWrapper sources={['postThreads']}>
                            <UltraFeedPostItem post={item.post} postMetaInfo={item.postMetaInfo} />
                          </FeedItemWrapper>
                        );
                      }
                    },
                    feedSpotlight: {
                      fragmentName: 'FeedSpotlightFragment',
                      render: (item: {_id: string, spotlight: FeedSpotlightFragment['spotlight']}) => {
                        if (!item || !item.spotlight) {
                          return null;
                        }

                        return (
                          <FeedItemWrapper sources={['spotlights']}>
                            <SpotlightFeedItem 
                              spotlight={item.spotlight}
                              showSubtitle={true}
                            />
                          </FeedItemWrapper>
                        );
                      }
                    }
                  }
                }
              />
            </div>
          </SingleColumnSection>
        </UltraFeedObserverProvider>
      </>}
    </div>
  );
};

// Create the wrapper component that uses DeferRender
const UltraFeed = () => {
  return (
    // TODO: possibly defer render shouldn't apply to the section title?
    <DeferRender ssr={false}>
      <UltraFeedContent />
    </DeferRender>
  );
};

const UltraFeedComponent = registerComponent('UltraFeed', UltraFeed);

declare global {
  interface ComponentTypes {
    UltraFeed: typeof UltraFeedComponent
  }
} 
