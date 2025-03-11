import React, { useCallback, useRef } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE } from '../../lib/cookies/cookies';
import { userHasUltraFeed } from '../../lib/betas';
import { useMulti } from '../../lib/crud/withMulti';
import type { ObservableQuery } from '@apollo/client';

const styles = (theme: ThemeType) => ({
  toggleContainer: {
    marginBottom: theme.spacing.unit * 2,
  },
  settingsButton: {
    '&&': {
      cursor: 'pointer',
      color: theme.palette.grey[600],
      fontSize: '1rem',
      opacity: 0.75,
      '&:hover': {
        opacity: 1,
      }
    }
  }
});

export const UltraFeed = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SectionFooterCheckbox, MixedTypeFeed, FeedPostCommentsCard, SuggestedFeedSubscriptions } = Components;
  
  const currentUser = useCurrentUser();
  const [ultraFeedCookie, setUltraFeedCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  const ultraFeedEnabled = ultraFeedCookie[ULTRA_FEED_ENABLED_COOKIE] === "true";

  // Setup refetch for subscribed content
  const refetchSubscriptionContentRef = useRef<null | ObservableQuery['refetch']>(null);
  const refetchSubscriptionContent = useCallback(() => {
    if (refetchSubscriptionContentRef.current) {
      void refetchSubscriptionContentRef.current();
    }
  }, [refetchSubscriptionContentRef]);

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
        <SuggestedFeedSubscriptions
          refetchFeed={refetchSubscriptionContent}
          settingsButton={suggestedUsersSettingsButton}
          existingSubscriptions={userSubscriptions}
        />

        <MixedTypeFeed
          resolverName="SubscribedFeed"
          firstPageSize={10}
          pageSize={20}
          sortKeyType="Date"
          reorderOnRefetch={true}
          refetchRef={refetchSubscriptionContentRef}
          renderers={{
            postCommented: {
              fragmentName: "SubscribedPostAndCommentsFeed",
              render: (postCommented: any) => {
                return <FeedPostCommentsCard
                  key={postCommented.post._id}
                  post={postCommented.post}
                  comments={postCommented.comments}
                  maxCollapsedLengthWords={postCommented.postIsFromSubscribedUser ? 200 : 50}
                  refetch={() => {}}
                />
              },
            }
          }}
        />
      </>}
    </div>
  );
};

const UltraFeedComponent = registerComponent('UltraFeed', UltraFeed, {styles});

declare global {
  interface ComponentTypes {
    UltraFeed: typeof UltraFeedComponent
  }
} 