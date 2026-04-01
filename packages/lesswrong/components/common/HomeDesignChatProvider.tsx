'use client';

import React, { useMemo, useState } from 'react';
import { HomeDesignChatContext } from './HomeDesignChatContext';

const homeDesignActiveStyles = `
  html, body {
    overflow: hidden !important;
    height: 100dvh !important;
  }
  .Header-root { display: none !important; }
  .Header-headerHeight { --header-height: 0px; }
  .RouteRootClient-centralColumn { padding-top: 0 !important; }
  #intercom-outer-frame, #intercom-container, .intercom-lightweight-app, .home-design-hide-llm-chat {
    display: none !important;
  }
`;

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
      <style>{homeDesignActiveStyles}</style>
      {children}
    </HomeDesignChatContext.Provider>
  );
};

export default HomeDesignChatProvider;
