'use client';

import React, { createContext, useState, useMemo } from 'react';
import { createContext as contextSelectorCreateContext } from "use-context-selector";
import type { EditorContents } from '../editor/Editor';
import type { EditorUserModeType } from '../editor/lexicalPlugins/suggestions/EditorUserMode';

interface DynamicTableOfContentsContextType {
  setToc: (document: EditorContents) => void;
}

type DisableNoKibitzContextType = { disableNoKibitz: boolean; setDisableNoKibitz: (disableNoKibitz: boolean) => void; };

export const UserContext = contextSelectorCreateContext<UsersCurrent|null>(null);
export const DynamicTableOfContentsContext = createContext<DynamicTableOfContentsContextType | null>(null);

export const DisableNoKibitzContext = createContext<DisableNoKibitzContextType>({ disableNoKibitz: false, setDisableNoKibitz: () => { } });

export const DisableNoKibitzContextProvider = ({children}: {
  children: React.ReactNode
}) => {
  const [disableNoKibitz, setDisableNoKibitz] = useState(false); 
  const noKibitzContext = useMemo(
    () => ({ disableNoKibitz, setDisableNoKibitz }),
    [disableNoKibitz, setDisableNoKibitz]
  );

  return <DisableNoKibitzContext.Provider value={noKibitzContext}>
    {children}
  </DisableNoKibitzContext.Provider>
}

interface InlineCommentsPanelContextType {
  showComments: boolean;
  setShowComments: React.Dispatch<React.SetStateAction<boolean>>;
  commentCount: number;
  setCommentCount: React.Dispatch<React.SetStateAction<number>>;
  /**
   * When set, the editor's comments panel renders docked inside this element
   * (the host owns open/close) instead of floating over the page.
   */
  panelPortalEl?: HTMLElement | null;
}

export const InlineCommentsPanelContext = createContext<InlineCommentsPanelContextType>({
  showComments: false,
  setShowComments: () => {},
  commentCount: 0,
  setCommentCount: () => {},
});

interface EditorUserModeContextType {
  userMode: EditorUserModeType;
  setUserMode: (mode: EditorUserModeType) => void;
  canEdit: boolean;
  canComment: boolean;
  /** Derived from both browser online/offline state and WebSocket connection status */
  isConnected: boolean;
  /** Set by the Lexical editor when the HocuspocusProvider status changes */
  setIsWsConnected: (connected: boolean) => void;
}

export const EditorUserModeContext = createContext<EditorUserModeContextType | null>(null);

// RelevantTestGroupAllocation: A dictionary from the names of A/B tests to
// which group a user is in, which is pruned to only the tests which affected
// a particular page render.
export type RelevantTestGroupAllocation = Record<string,string>

// Used for tracking which A/B test groups were relevant to the page rendering
export const ABTestGroupsUsedContext = React.createContext<RelevantTestGroupAllocation>({});
