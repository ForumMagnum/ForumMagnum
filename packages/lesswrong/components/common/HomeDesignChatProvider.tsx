'use client';

import React, { useMemo, useState } from 'react';
import { HomeDesignChatContext } from './HomeDesignChatContext';

const HomeDesignChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSrcdoc, setCustomSrcdoc] = useState<string | null>(null);
  const [useDefaultDesign, setUseDefaultDesign] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);

  const value = useMemo(() => ({
    isOpen,
    setIsOpen,
    applyDesign: (html: string | null) => {
      setCustomSrcdoc(html);
      if (html !== null) {
        setUseDefaultDesign(false);
      }
    },
    customSrcdoc,
    useDefaultDesign,
    setUseDefaultDesign,
    publicId,
    setPublicId,
  }), [isOpen, customSrcdoc, useDefaultDesign, publicId]);

  return (
    <HomeDesignChatContext.Provider value={value}>
      {children}
    </HomeDesignChatContext.Provider>
  );
};

export default HomeDesignChatProvider;
