import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $getMarkIDs, $isMarkNode, MarkNode } from '@lexical/mark';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type EditorState,
  type NodeKey,
} from 'lexical';
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const RESEARCH_ANCHOR_PREFIX = 'ranchor_';

export const isResearchAnchorId = (id: string): boolean => id.startsWith(RESEARCH_ANCHOR_PREFIX);

export const newResearchAnchorId = (): string => {
  const rand = Math.random().toString(36).slice(2, 12);
  const time = Date.now().toString(36);
  return `${RESEARCH_ANCHOR_PREFIX}${time}_${rand}`;
};

export type ResearchAnchorMap = Map<string, Set<NodeKey>>;

interface ResearchAnchorContextValue {
  anchorMap: ResearchAnchorMap;
  activeAnchorIds: string[];
  activeAnchorRangeKey: NodeKey | null;
}

const ResearchAnchorContext = createContext<ResearchAnchorContextValue | null>(null);

export const useResearchAnchorContext = (): ResearchAnchorContextValue => {
  const context = useContext(ResearchAnchorContext);
  if (!context) {
    throw new Error('useResearchAnchorContext must be used within a ResearchAnchorProvider');
  }
  return context;
};

export function ResearchAnchorProvider({ children }: { children: ReactNode }) {
  const [editor] = useLexicalComposerContext();

  const anchorMap = useMemo<ResearchAnchorMap>(() => new Map(), []);
  const [activeAnchorIds, setActiveAnchorIds] = useState<string[]>([]);
  const [activeAnchorRangeKey, setActiveAnchorRangeKey] = useState<NodeKey | null>(null);

  useEffect(() => {
    const markNodeKeysToIDs = new Map<NodeKey, string[]>();

    const trackMutations = editor.registerMutationListener(MarkNode, (mutations) => {
      editor.getEditorState().read(() => {
        for (const [key, mutation] of mutations) {
          const node = $getNodeByKey(key);
          let ids: string[] = [];

          if (mutation === 'destroyed') {
            ids = markNodeKeysToIDs.get(key) ?? [];
          } else if ($isMarkNode(node)) {
            ids = node.getIDs().filter(isResearchAnchorId);
          }

          if (mutation !== 'destroyed') {
            markNodeKeysToIDs.set(key, ids);
          }

          for (const id of ids) {
            if (!isResearchAnchorId(id)) continue;
            let keys = anchorMap.get(id);

            if (mutation === 'destroyed') {
              if (keys !== undefined) {
                keys.delete(key);
                if (keys.size === 0) anchorMap.delete(id);
              }
            } else {
              if (keys === undefined) {
                keys = new Set();
                anchorMap.set(id, keys);
              }
              keys.add(key);
            }
          }

          if (mutation === 'destroyed') {
            markNodeKeysToIDs.delete(key);
          }
        }
      });
    });

    const trackSelection = editor.registerUpdateListener(({ editorState }: { editorState: EditorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        let activeIds: string[] = [];
        let rangeKey: NodeKey | null = null;

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          if ($isTextNode(anchorNode)) {
            const ids = $getMarkIDs(anchorNode, selection.anchor.offset);
            if (ids) {
              activeIds = ids.filter(isResearchAnchorId);
            }
            if (!selection.isCollapsed() && activeIds.length > 0) {
              rangeKey = anchorNode.getKey();
            }
          }
        }

        setActiveAnchorIds((prev) =>
          prev.length === activeIds.length && prev.every((id, i) => id === activeIds[i]) ? prev : activeIds,
        );
        setActiveAnchorRangeKey((prev) => (prev === rangeKey ? prev : rangeKey));
      });
    });

    return mergeRegister(trackMutations, trackSelection);
  }, [editor, anchorMap]);

  const value = useMemo(
    () => ({ anchorMap, activeAnchorIds, activeAnchorRangeKey }),
    [anchorMap, activeAnchorIds, activeAnchorRangeKey],
  );

  return <ResearchAnchorContext.Provider value={value}>{children}</ResearchAnchorContext.Provider>;
}
