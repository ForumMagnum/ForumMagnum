import React, { useCallback, useRef, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE } from '../../lib/cookies/cookies';
import { userHasUltraFeed } from '../../lib/betas';
import { useMulti } from '../../lib/crud/withMulti';
import type { ObservableQuery } from '@apollo/client';
import classNames from 'classnames';
import { randomId } from '../../lib/random';
import DeferRender from '../common/DeferRender';
import { Link } from '@/lib/reactRouterWrapper';
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
  historyContainer: {
  },
  endOfFeedContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: 20,
    marginBottom: 20,
  },
  newContentButton: {
    display: 'flex',
    justifySelf: 'center',
    justifyContent: 'center',
    color: theme.palette.primary.dark,
    padding: '20px 20px',
    width: 200,
    fontSize: '1.2rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
    textAlign: 'center',
    cursor: 'pointer',
    fontWeight: 500,
    '&:hover': {
      opacity: 0.8
    }
  },
  endOfFeedButtonPostScriptText: {
    fontSize: '1rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.6,
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
  
  // State for settings drawer visibility
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Generate a new session ID for each component mount
  const [sessionId] = useState(() => randomId());
  
  // State to track if the history feed has reached the end
  const [reachedEndOfHistory, setReachedEndOfHistory] = useState(false);
  
  // Ref for the top section to scroll to
  const topSectionRef = useRef<HTMLDivElement>(null);

  // Setup refetch for subscribed content
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);
  const refetchSubscriptionContent = useCallback(() => {
    if (refetchSubscriptionContentRef.current) {
      void refetchSubscriptionContentRef.current();
    }
  }, [refetchSubscriptionContentRef]);

  // Ref for the loadMoreAtTop function
  const loadMoreAtTopRef = useRef<null | (() => void)>(null);
  const loadMoreAtTop = useCallback(() => {
    // if (loadMoreAtTopRef.current) {
    //   loadMoreAtTopRef.current();
    // }
  }, [loadMoreAtTopRef]);

  // Function to handle end of feed button click
  const handleEndOfFeedClick = useCallback(() => {
    // Start loading more content immediately
    loadMoreAtTop();
    
    // Then scroll to the top of the feed
    if (topSectionRef.current) {
      topSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loadMoreAtTop]);

  // Callback for MixedTypeFeed to notify when it has reached the end
  const onReachedEnd = useCallback((isAtEnd: boolean) => {
    setReachedEndOfHistory(isAtEnd);
  }, []);

  // Get user subscriptions
  const { results: userSubscriptions } = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: "Users",
      subscriptionType: "newActivityForFeed",
      limit: 1000
    },
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
    skip: !currentUser
  });

  // Generic refetch function for the feed
  const refetch = useCallback(() => {
    if (refetchSubscriptionContentRef.current) {
      void refetchSubscriptionContentRef.current();
    }
  }, [refetchSubscriptionContentRef]);

  // Early return if user doesn't have access to UltraFeed
  if (!userHasUltraFeed(currentUser)) {
    return null;
  }

  const toggleUltraFeed = () => {
    setUltraFeedCookie(ULTRA_FEED_ENABLED_COOKIE, String(!ultraFeedEnabled), { path: "/" });
  };

  // Simple settings button specifically for UltraFeed
  const suggestedUsersSettingsButton = (
    <span className={classes.settingsButton}>
      {/* This text will be replaced by the SuggestedFeedSubscriptions component */}
      Show
    </span>
  );
  
  // Toggle settings drawer
  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the container's onClick
    setSettingsVisible(!settingsVisible);
  };
  
  // Custom title with refresh button
  const customTitle = <>
    <div className={classes.titleContainer} onClick={loadMoreAtTop}>
      <span className={classes.titleText}>
        <span className={classes.titleTextDesktop}>Update Feed</span>
        <span className={classes.titleTextMobile}>The Feed</span>
      </span>
      {/* <span className={classes.refreshText}>click for more</span> */}
    </div>
    <div className={classes.settingsButtonContainer}>
      <SettingsButton 
        showIcon={true}
        onClick={toggleSettings}
      />
    </div>
  </>;

  const newContentButton = <div className={classes.newContentButton} onClick={handleEndOfFeedClick}>click for new content</div>

  const postScriptText = `The primary thing when you take your device in your hands is your intention to cut the OP, what whatever that means. When you scroll, click, zoom, vote, comment, or otherwise read the author's content, you must cut the OP in the same movement. It is essential to attain. 
  If you think only of scrolling, clicking, zooming, voting or otherwise reading, you will not be able to actually cut them.`;

  // Component to render when we reach the end of the feed
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
                firstPageSize={30}
                pageSize={15}
                refetchRef={refetchSubscriptionContentRef}
                loadMoreRef={loadMoreAtTopRef}
                prependedLoadMore={false}
                resolverArgsValues={{ sessionId }}
                renderers={{
                    feedCommentThread: {
                      fragmentName: 'FeedCommentThreadFragment',
                      render: (item: FeedCommentThreadFragment) => {
                        if (!item) {
                          console.log("Missing feed item data:", item);
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
                          console.log("Missing feed item data:", item);
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
                          console.log("Missing spotlight data from UltraFeed render function:", item);
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
            {/* {newContentButton} */}
            {/* History Feed Section
            <div className={classes.historyContainer}>
              <MixedTypeFeed
                resolverName="UltraFeedHistory"
                sortKeyType="Date"
                firstPageSize={20}
                pageSize={10}
                renderers={ultraFeedRenderer}
                resolverArgsValues={{ sessionId }}
                onReachedEnd={onReachedEnd}
              />
            </div>
            {reachedEndOfHistory && <div className={classes.endOfFeedContainer}>
              {newContentButton}
              <Divider />
              <Link className={classes.endOfFeedButtonPostScriptText} to={'/posts/7ZqGiPHTpiDMwqMN2'}>{postScriptText}</Link>
            </div>} */}
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
