"use client";

import React, { useState } from 'react';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import AnalyticsInViewTracker from '@/components/common/AnalyticsInViewTracker';
import SingleColumnSection from '@/components/common/SingleColumnSection';
import { ultraFeedEnabledSetting } from '@/lib/instanceSettings';
import DeferRender from '@/components/common/DeferRender';
import { UltraFeedObserverProvider } from '@/components/ultraFeed/UltraFeedObserver';
import { OverflowNavObserverProvider } from '@/components/ultraFeed/OverflowNavObserverContext';
import { randomId } from '@/lib/random';
import { useUltraFeedSettings } from '@/components/hooks/useUltraFeedSettings';
import UltraFeedMainFeed from '@/components/ultraFeed/UltraFeedMainFeed';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("HomepageV2Content", (theme: ThemeType) => ({
  header: {
    marginBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 24,
    fontWeight: 700,
    color: theme.palette.text.primary,
  },
  subtitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    color: theme.palette.text.dim,
    marginTop: 8,
  },
}));

const HomepageV2Content = () => {
  const classes = useStyles(styles);
  const [sessionId] = useState<string>(randomId);
  const { settings } = useUltraFeedSettings();

  if (!ultraFeedEnabledSetting.get()) {
    return (
      <SingleColumnSection>
        <div style={{ textAlign: 'center', padding: 40 }}>
          The New Feed is currently disabled.
        </div>
      </SingleColumnSection>
    );
  }

  return (
    <AnalyticsContext pageSectionContext="ultraFeed" ultraFeedContext={{ feedSessionId: sessionId }}>
      <AnalyticsInViewTracker eventProps={{inViewType: "ultraFeed"}}>
        <SingleColumnSection>
          <div className={classes.header}>
            <h1 className={classes.title}>Your Feed V2</h1>
            <div className={classes.subtitle}>
              Redesigned with plain text formatting and improved layout
            </div>
          </div>
          <UltraFeedObserverProvider incognitoMode={settings.resolverSettings.incognitoMode}>
            <OverflowNavObserverProvider>
              <DeferRender ssr={false}>
                <UltraFeedMainFeed
                  settings={settings}
                  sessionId={sessionId}
                  fetchPolicy="cache-first"
                  loadMoreDistanceProp={1000}
                  firstPageSize={15}
                  pageSize={30}
                  isActive={true}
                />
              </DeferRender>
            </OverflowNavObserverProvider>
          </UltraFeedObserverProvider>
        </SingleColumnSection>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  );
};

export default HomepageV2Content;
