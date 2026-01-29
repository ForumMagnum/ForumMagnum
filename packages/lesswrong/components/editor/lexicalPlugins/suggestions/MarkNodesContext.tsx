import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, type LexicalNode, type NodeKey } from 'lexical';
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { $isSuggestionNode } from '../suggestedEdits/ProtonNode';

export type MarkNodeMap = Map<string, Set<NodeKey>>;

type MarkNodesContextValue = {
  markNodeMap: MarkNodeMap;
  activeAnchorKey: NodeKey | null;
  activeIDs: string[];
};

const MarkNodesContext = createContext<MarkNodesContextValue | null>(null);

export const useMarkNodesContext = () => {
  const context = useContext(MarkNodesContext);
  if (!context) {
    throw new Error('useMarkNodesContext must be used within a MarkNodesProvider');
  }
  return context;
};

export function MarkNodesProvider({ children }: { children: ReactNode }) {
  const [editor] = useLexicalComposerContext();

  const markNodeMap = useMemo<Map<string, Set<NodeKey>>>(() => new Map(), []);
  const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>(null);
  const [activeIDs, setActiveIDs] = useState<string[]>([]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        let hasActiveIds = false;
        let hasAnchorKey = false;

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          let suggestionId: string | null = null;

          let current: LexicalNode | null = anchorNode;
          while (current) {
            if ($isSuggestionNode(current)) {
              suggestionId = current.getSuggestionIdOrThrow();
              break;
            }
            current = current.getParent();
          }

          if (suggestionId) {
            setActiveIDs([suggestionId]);
            hasActiveIds = true;
          }

          if (!selection.isCollapsed()) {
            setActiveAnchorKey(anchorNode.getKey());
            hasAnchorKey = true;
          }
        }

        if (!hasActiveIds) {
          setActiveIDs((existing) => (existing.length === 0 ? existing : []));
        }
        if (!hasAnchorKey) {
          setActiveAnchorKey(null);
        }
      });
    });
  }, [editor]);

  return (
    <MarkNodesContext.Provider
      value={{
        markNodeMap,
        activeAnchorKey,
        activeIDs,
      }}
    >
      {children}
    </MarkNodesContext.Provider>
  );
}
