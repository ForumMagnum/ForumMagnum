'use client';

import { createContext, useContext } from 'react';

interface HomeDesignChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  applyDesign: (html: string) => void;
  customSrcdoc: string | null;
  publicId: string | null;
  setPublicId: (id: string) => void;
}

export const HomeDesignChatContext = createContext<HomeDesignChatContextType | null>(null);

export function useHomeDesignChat(): HomeDesignChatContextType {
  const context = useContext(HomeDesignChatContext);
  if (!context) {
    throw new Error('useHomeDesignChat must be used within a HomeDesignChatProvider');
  }
  return context;
}
