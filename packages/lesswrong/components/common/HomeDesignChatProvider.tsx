'use client';

import React, { useState, useMemo } from 'react';
import { HomeDesignChatContext } from './HomeDesignChatContext';

const HomeDesignChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSrcdoc, setCustomSrcdoc] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  const value = useMemo(() => ({
    isOpen,
    setIsOpen,
    applyDesign: setCustomSrcdoc,
    customSrcdoc,
    publicId,
    setPublicId,
  }), [isOpen, customSrcdoc, publicId]);

  return (
    <HomeDesignChatContext.Provider value={value}>
      {children}
    </HomeDesignChatContext.Provider>
  );
};

export default HomeDesignChatProvider;
