import React, { useCallback, useState, useRef } from 'react';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { UltraFeedSubscriptionsQuery } from '../common/feeds/feedQueries';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { createUltraFeedRenderers } from './renderers/createUltraFeedRenderers';
import { UltraFeedSettingsType } from './ultraFeedSettingsTypes';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import SuggestedFeedSubscriptions from '../subscriptions/SuggestedFeedSubscriptions';

// Keep in sync with UltraFeedBottomBar.tsx
const FEED_TOP_SCROLL_OFFSET = 96;

const styles = defineStyles('UltraFeedSubscriptionsFeed', (theme: ThemeType) => ({
  feedContainer: {
    // marginTop: 16,
  },
  titleText: {
    // Align with SectionTitle expectations; keep default styling
  },
  ultraFeedFollowingHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[600],
  },
  checkboxInput: {
    padding: 4,
    color: theme.palette.grey[500],
  },
  checkboxLabel: {
    cursor: 'pointer',
    fontSize: '1.15rem',
    fontFamily: theme.typography.fontFamily,
    textWrap: 'nowrap',
  },
  returnToTopBar: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
    marginTop: 16,
  },
  returnToTopLink: {
    ...theme.typography.commentStyle,
    color: theme.palette.primary.main,
    fontSize: 14,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },

}));

interface UltraFeedSubscriptionsFeedProps {
  embedded?: boolean;
  refetchRef?: React.MutableRefObject<null | (() => void)>;
  settings: UltraFeedSettingsType;
  updateSettings?: (newSettings: Partial<UltraFeedSettingsType>) => void;
  showHideReadToggle?: boolean;
}

const UltraFeedSubscriptionsFeed = ({ embedded = false, refetchRef, settings, updateSettings, showHideReadToggle = true }: UltraFeedSubscriptionsFeedProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  
  const handleDataLoaded = useCallback((results: Array<{type: string, [key: string]: unknown}>, loading: boolean) => {
    setIsLoading(loading);
  }, []);

  if (!currentUser) return null;

  const { feedCommentThread, feedPost, feedSubscriptionSuggestions } = createUltraFeedRenderers({ settings });

  const hideRead = settings?.resolverSettings?.subscriptionsFeedSettings?.hideRead ?? false;
  const handleToggleHideRead = (checked: boolean) => {
    if (!updateSettings) return;
    updateSettings({
      resolverSettings: {
        ...settings.resolverSettings,
        subscriptionsFeedSettings: {
          ...settings.resolverSettings.subscriptionsFeedSettings,
          hideRead: checked,
        },
      },
    });
  };

  const handleReturnToTop = () => {
    const targetTop = (() => {
      if (feedContainerRef.current) {
        const rect = feedContainerRef.current.getBoundingClientRect();
        return Math.max(0, rect.top + window.pageYOffset - FEED_TOP_SCROLL_OFFSET);
      }
      return 0;
    })();
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const content = <div ref={feedContainerRef} className={classes.feedContainer}>
    {showHideReadToggle && (
      <div className={classes.ultraFeedFollowingHeader}>
        <div className={classes.checkboxContainer}>
          <Checkbox
            className={classes.checkboxInput}
            checked={hideRead}
            onChange={(e) => handleToggleHideRead(e.target.checked)}
          />
          <span className={classes.checkboxLabel}> Hide Read </span>
        </div>
      </div>
    )}
    <MixedTypeFeed
      query={UltraFeedSubscriptionsQuery}
      variables={{ settings: { subscriptionsFeedSettings: { hideRead } } }}
      firstPageSize={20}
      pageSize={30}
      fetchPolicy="network-only"
      refetchRef={refetchRef}
      onDataLoaded={handleDataLoaded}
      renderers={{
        feedCommentThread,
        feedPost,
        feedSubscriptionSuggestions,
      }}
    />
    {!isLoading && <>
      <SuggestedFeedSubscriptions enableDismissButton={false} />
      <div className={classes.returnToTopBar}>
        <a className={classes.returnToTopLink} onClick={handleReturnToTop}>
          Return to top of feed
        </a>
      </div>
    </>}
  </div>

  if (embedded) return content;

  return (
    <SingleColumnSection>
      <SectionTitle title="Following" titleClassName={classes.titleText} />
      {content}
    </SingleColumnSection>
  );
};

export default UltraFeedSubscriptionsFeed;

