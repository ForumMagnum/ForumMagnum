'use client';

import { createContext, useContext } from 'react';

interface HomeDesignChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  applyDesign: (html: string) => void;
  customSrcdoc: string | null;
}

export const HomeDesignChatContext = createContext<HomeDesignChatContextType | null>(null);

export function useHomeDesignChat(): HomeDesignChatContextType | null {
  return useContext(HomeDesignChatContext);
}
