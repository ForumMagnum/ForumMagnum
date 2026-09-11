'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { HomeDesignChatContext } from './HomeDesignChatContext';
import { useSubscribedLocation } from '@/lib/routeUtil';

const HomeDesignChatProvider = ({
  children,
  initialIsOpen = false,
}: {
  children: React.ReactNode,
  initialIsOpen?: boolean,
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [customSrcdoc, setCustomSrcdoc] = useState<string | null>(null);
  const [useDefaultDesign, setUseDefaultDesign] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);

  const { query } = useSubscribedLocation();
  const openCustomizeParam = typeof query.openCustomize === 'string' ? query.openCustomize : undefined;
  const currentUrlIsOpenCustomize = Boolean(openCustomizeParam);
  useEffect(() => {
    if (currentUrlIsOpenCustomize !== isOpen) {
      setIsOpen(currentUrlIsOpenCustomize);
    }
  }, [currentUrlIsOpenCustomize, isOpen]);

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
