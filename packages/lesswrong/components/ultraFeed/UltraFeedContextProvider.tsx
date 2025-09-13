import React, { createContext, useContext } from 'react';
import { FeedType } from './ultraFeedTypes';

interface UltraFeedContextType {
  openInNewTab: boolean;
  feedType: FeedType;
}

const UltraFeedContext = createContext<UltraFeedContextType | undefined>(undefined);

export const UltraFeedContextProvider = ({ 
  children, 
  openInNewTab = false,
  feedType = 'ultraFeed'
}: { 
  children: React.ReactNode;
  openInNewTab?: boolean;
  feedType?: FeedType;
}) => {
  return (
    <UltraFeedContext.Provider value={{ openInNewTab, feedType }}>
      {children}
    </UltraFeedContext.Provider>
  );
};

export const useUltraFeedContext = () => {
  const context = useContext(UltraFeedContext);
  return context ?? { openInNewTab: false, feedType: 'ultraFeed' };
};

