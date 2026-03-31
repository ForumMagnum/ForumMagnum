'use client';

import React, { useState, useMemo } from 'react';
import { HomeDesignChatContext } from './HomeDesignChatContext';

const HomeDesignChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSrcdoc, setCustomSrcdoc] = useState<string | null>(null);

  const value = useMemo(() => ({
    isOpen,
    setIsOpen,
    applyDesign: setCustomSrcdoc,
    customSrcdoc,
  }), [isOpen, customSrcdoc]);

  return (
    <HomeDesignChatContext.Provider value={value}>
      {children}
    </HomeDesignChatContext.Provider>
  );
};

export default HomeDesignChatProvider;
