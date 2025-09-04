import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  const [minHeightPx, setMinHeightPx] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastHeightRef = useRef<number>(0);
  
  const handleDataLoaded = useCallback((results: Array<{type: string, [key: string]: unknown}>, loading: boolean) => {
    setIsLoading(loading);
    if (!loading && isTransitioning) {
      setIsTransitioning(false);
      // Allow height to adjust naturally after a brief delay
      setTimeout(() => {
        if (!isTransitioning) {
          setMinHeightPx(0);
        }
      }, 100);
    }
  }, [isTransitioning]);

  // Track container height to maintain during transitions
  useEffect(() => {
    const el = feedContainerRef.current;
    if (!el || isTransitioning) return;
    
    const resizeObserver = new ResizeObserver(() => {
      const h = el.offsetHeight || 0;
      if (h > 0) {
        lastHeightRef.current = h;
      }
    });
    
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [isTransitioning]);

  if (!currentUser) return null;

  const { feedCommentThread, feedPost, feedSubscriptionSuggestions } = createUltraFeedRenderers({ settings });

  const hideRead = settings?.resolverSettings?.subscriptionsFeedSettings?.hideRead ?? false;
  const handleToggleHideRead = (checked: boolean) => {
    if (!updateSettings) return;
    
    // Capture current height before transition
    if (feedContainerRef.current) {
      const currentHeight = feedContainerRef.current.offsetHeight;
      if (currentHeight > 0) {
        lastHeightRef.current = currentHeight;
        setMinHeightPx(currentHeight);
        setIsTransitioning(true);
      }
    }
    
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

  const content = <div 
    ref={feedContainerRef} 
    className={classes.feedContainer}
    style={minHeightPx > 0 ? { minHeight: minHeightPx } : undefined}
  >
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

