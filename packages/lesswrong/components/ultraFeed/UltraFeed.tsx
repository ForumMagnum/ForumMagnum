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

const styles = (theme: ThemeType) => ({
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
  feedContainer: {
    marginTop: 16
  },
  feedComementItem: {
    marginBottom: 16
  },
  sectionTitle: {
    marginTop: 60,
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
  refreshText: {
    // margin: '0 auto',
    fontSize: '0.65em',
    fontStyle: 'italic',
    fontFamily: theme.palette.fonts.sansSerifStack,
    pointerEvents: 'none',
    marginRight: -60
  },
  settingsButtonContainer: {
    flex: '1 1 0',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  }
});

// Define the main component implementation
const UltraFeedContent = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SectionFooterCheckbox, MixedTypeFeed, SuggestedFeedSubscriptions, QuickTakesListItem, 
    FeedItemWrapper, FeedPostCommentsCard, SectionTitle, SingleColumnSection, SettingsButton } = Components;
  
  const currentUser = useCurrentUser();
  const [ultraFeedCookie, setUltraFeedCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  const ultraFeedEnabled = ultraFeedCookie[ULTRA_FEED_ENABLED_COOKIE] === "true";
  
  // Generate a new session ID for each component mount
  const [sessionId] = useState(() => randomId())

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
    if (loadMoreAtTopRef.current) {
      loadMoreAtTopRef.current();
    }
  }, [loadMoreAtTopRef]);

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
  
  // Custom title with refresh button
  const customTitle = <>
    <div className={classes.titleContainer} onClick={loadMoreAtTop}>
      <span className={classes.titleText}>Update Feed</span>
      <span className={classes.refreshText}>click for more content</span>
    </div>
    <div className={classes.settingsButtonContainer}>
      <SettingsButton 
        showIcon={true}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation(); // Prevent triggering the container's onClick
          /* No-op for now */
        }}
      />
    </div>
  </>;

  return (
    <div>
      <div className={classes.toggleContainer}>
        <SectionFooterCheckbox 
          value={ultraFeedEnabled} 
          onClick={toggleUltraFeed} 
          label="Use UltraFeed"
          tooltip="Hide Quick Takes and Popular Comments sections and show a feed of posts and comments from users you subscribe to"
        />
      </div>
      
      {ultraFeedEnabled && <>
        <SingleColumnSection>
          <SectionTitle title={customTitle} titleClassName={classes.sectionTitle} />
          {/* <SuggestedFeedSubscriptions
            refetchFeed={refetchSubscriptionContent}
            settingsButton={suggestedUsersSettingsButton}
            existingSubscriptions={userSubscriptions}
          /> */}
          
          <div className={classes.feedContainer}>
            <MixedTypeFeed
              resolverName="UltraFeed"
              sortKeyType="Date"
              firstPageSize={10}
              pageSize={5}
              refetchRef={refetchSubscriptionContentRef}
              loadMoreRef={loadMoreAtTopRef}
              prependedLoadMore={true}
              resolverArgsValues={{ sessionId: sessionId ?? undefined }}
              renderers={{
                ultraFeedItem: {
                  fragmentName: 'UltraFeedItemFragment',
                  render: (ultraFeedItem) => {
                    // Handle based on renderAsType
                    if (ultraFeedItem.renderAsType === 'feedComment') {
                      const comment = ultraFeedItem.primaryComment;
                      return (
                        <FeedItemWrapper sources={ultraFeedItem.sources}>
                          <QuickTakesListItem 
                            key={comment._id}
                            quickTake={comment}
                          />
                        </FeedItemWrapper>
                      );
                    } else {
                      // Render as post
                      return (
                        <FeedItemWrapper sources={ultraFeedItem.sources}>
                          <FeedPostCommentsCard
                            key={ultraFeedItem.primaryPost._id}
                            post={ultraFeedItem.primaryPost}
                            comments={ultraFeedItem.secondaryComments || []}
                            maxCollapsedLengthWords={200}
                            refetch={refetch}
                          />
                        </FeedItemWrapper>
                      );
                    }
                  }
                }
              }}
            />
          </div>
        </SingleColumnSection>
      </>}
    </div>
  );
};

// Create the wrapper component that uses DeferRender
export const UltraFeed = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    // TODO: possibly defer render shouldn't apply to the section title?
    <DeferRender ssr={false}>
      <UltraFeedContent classes={classes} />
    </DeferRender>
  );
};

const UltraFeedComponent = registerComponent('UltraFeed', UltraFeed, {styles});

declare global {
  interface ComponentTypes {
    UltraFeed: typeof UltraFeedComponent
  }
} 
