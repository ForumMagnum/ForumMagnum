'use client';

import { createContext, useContext } from 'react';

interface HomeDesignChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  applyDesign: (html: string | null) => void;
  customSrcdoc: string | null;
  useDefaultDesign: boolean;
  setUseDefaultDesign: (useDefault: boolean) => void;
  publicId: string | null;
  setPublicId: (id: string | null) => void;
}

export const HomeDesignChatContext = createContext<HomeDesignChatContextType | null>(null);

export function useHomeDesignChat(): HomeDesignChatContextType {
  const context = useContext(HomeDesignChatContext);
  if (!context) {
    throw new Error('useHomeDesignChat must be used within a HomeDesignChatProvider');
  }
  return context;
}
