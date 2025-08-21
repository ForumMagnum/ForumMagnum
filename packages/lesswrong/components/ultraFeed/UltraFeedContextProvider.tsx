import React, { createContext, useContext } from 'react';

interface UltraFeedContextType {
  openInNewTab: boolean;
}

const UltraFeedContext = createContext<UltraFeedContextType | undefined>(undefined);

export const UltraFeedContextProvider = ({ 
  children, 
  openInNewTab = false 
}: { 
  children: React.ReactNode;
  openInNewTab?: boolean;
}) => {
  return (
    <UltraFeedContext.Provider value={{ openInNewTab }}>
      {children}
    </UltraFeedContext.Provider>
  );
};

export const useUltraFeedContext = () => {
  const context = useContext(UltraFeedContext);
  return context ?? { openInNewTab: false };
};

