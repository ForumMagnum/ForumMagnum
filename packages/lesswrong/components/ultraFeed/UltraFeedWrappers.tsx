import React from 'react';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { UltraFeedObserverProvider } from './UltraFeedObserver';
import { UltraFeedContextProvider } from './UltraFeedContextProvider';
import { OverflowNavObserverProvider } from './OverflowNavObserverContext';
import { FeedType } from './ultraFeedTypes';

interface UltraFeedWrappersProps {
  children: React.ReactNode;
  incognitoMode: boolean;
  feedType: FeedType;
  openInNewTab?: boolean;
}

const UltraFeedWrappers = ({
  children,
  incognitoMode,
  feedType,
  openInNewTab,
}: UltraFeedWrappersProps) => {
  return (
    <AnalyticsContext ultraFeedType={feedType}>
      <UltraFeedObserverProvider incognitoMode={incognitoMode}>
        <UltraFeedContextProvider feedType={feedType} openInNewTab={openInNewTab}>
          <OverflowNavObserverProvider>
            {children}
          </OverflowNavObserverProvider>
        </UltraFeedContextProvider>
      </UltraFeedObserverProvider>
    </AnalyticsContext>
  );
};

export default UltraFeedWrappers;


