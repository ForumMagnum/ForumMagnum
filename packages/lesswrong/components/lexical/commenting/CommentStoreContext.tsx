import React, { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Provider } from '@lexical/yjs';
import { Doc } from 'yjs';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';

import { CommentStore } from './index';
import type { HocuspocusProvider } from '@hocuspocus/provider';

type CommentStoreContextValue = {
  commentStore: CommentStore;
};

const CommentStoreContext = createContext<CommentStoreContextValue | null>(null);

export const useCommentStoreContext = (): CommentStoreContextValue => {
  const context = useContext(CommentStoreContext);
  if (!context) {
    throw new Error('useCommentStoreContext must be used within a CommentStoreProvider');
  }
  return context;
};

export function CommentStoreProvider({
  children,
  providerFactory,
}: {
  children: ReactNode;
  providerFactory?: (id: string, yjsDocMap: Map<string, Doc>) => Provider & HocuspocusProvider;
}) {
  const [editor] = useLexicalComposerContext();
  const collabContext = useCollaborationContext();

  const commentStore = useMemo(() => new CommentStore(editor), [editor]);

  useEffect(() => {
    if (!providerFactory) {
      return undefined;
    }
    const provider = providerFactory('comments', collabContext.yjsDocMap);
    return commentStore.registerCollaboration(provider);
  }, [commentStore, collabContext.yjsDocMap, providerFactory]);

  return (
    <CommentStoreContext.Provider value={{ commentStore }}>
      {children}
    </CommentStoreContext.Provider>
  );
}
