'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { HomeDesignChatContext } from './HomeDesignChatContext';

const HomeDesignChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSrcdoc, setCustomSrcdoc] = useState<string | null>(null);
  const [useDefaultDesign, setUseDefaultDesign] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlHeight = document.documentElement.style.height;

    document.body.dataset.homeDesignActive = 'true';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100dvh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100dvh';

    return () => {
      delete document.body.dataset.homeDesignActive;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.height = prevHtmlHeight;
    };
  }, []);

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
