import React, { createContext, useContext, useState } from 'react';
import { FeedType } from './ultraFeedTypes';

interface UltraFeedContextType {
  openInNewTab: boolean;
  feedType: FeedType;
  showScoreBreakdown: boolean;
  setShowScoreBreakdown: (show: boolean) => void;
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
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  
  return (
    <UltraFeedContext.Provider value={{ openInNewTab, feedType, showScoreBreakdown, setShowScoreBreakdown }}>
      {children}
    </UltraFeedContext.Provider>
  );
};

export const useUltraFeedContext = () => {
  const context = useContext(UltraFeedContext);
  return context ?? { openInNewTab: false, feedType: 'ultraFeed', showScoreBreakdown: false, setShowScoreBreakdown: () => {} };
};

