import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $getMarkIDs } from '@lexical/mark';
import { $getSelection, $isElementNode, $isRangeSelection, $isTextNode, type EditorState, type ElementNode, type LexicalNode, type NodeKey } from 'lexical';
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { $getSuggestionID } from '../suggestedEdits/Utils';
import { $isSuggestionThatAffectsWholeParent } from '../suggestedEdits/Types';

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
    const addClassToActiveMarkNodes = () => {
      const changedElements: HTMLElement[] = [];
      for (const id of activeIDs) {
        const keys = markNodeMap.get(id);
        if (!keys) {
          continue;
        }
        for (const key of keys) {
          const element = editor.getElementByKey(key);
          if (!element) {
            continue;
          }
          element.classList.add('selected');
          changedElements.push(element);
        }
      }
      return () => {
        for (const element of changedElements) {
          element.classList.remove('selected');
        }
      };
    };

    const updateActiveIds = ({ editorState }: { editorState: EditorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        let hasActiveIds = false;
        let hasAnchorKey = false;

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();

          let suggestionThatAffectsWholeNode;
          if ($isElementNode(anchorNode) && !anchorNode.isInline()) {
            const siblings = anchorNode.getParent()?.getChildren();
            suggestionThatAffectsWholeNode = siblings?.find($isSuggestionThatAffectsWholeParent);
          }

          const nonInlineParent = $findMatchingParent(
            anchorNode,
            (node): node is ElementNode => $isElementNode(node) && !node.isInline(),
          );
          if (nonInlineParent) {
            const children = nonInlineParent.getChildren();
            suggestionThatAffectsWholeNode = children.find($isSuggestionThatAffectsWholeParent);
            if (!suggestionThatAffectsWholeNode) {
              const siblings = nonInlineParent.getParent()?.getChildren();
              suggestionThatAffectsWholeNode = siblings?.find($isSuggestionThatAffectsWholeParent);
            }
          }

          if (suggestionThatAffectsWholeNode) {
            setActiveIDs([suggestionThatAffectsWholeNode.getSuggestionIdOrThrow()]);
            hasActiveIds = true;
          }

          if ($isTextNode(anchorNode)) {
            const commentIDs = $getMarkIDs(anchorNode, selection.anchor.offset);
            if (commentIDs !== null) {
              setActiveIDs(commentIDs);
              hasActiveIds = true;
            } else {
              const suggestionID = $getSuggestionID(anchorNode, selection.anchor.offset);
              if (suggestionID) {
                setActiveIDs([suggestionID]);
                hasActiveIds = true;
              }
            }
            if (!selection.isCollapsed()) {
              setActiveAnchorKey(anchorNode.getKey());
              hasAnchorKey = true;
            }
          }
        }

        if (!hasActiveIds) {
          setActiveIDs((existing) => (existing.length === 0 ? existing : []));
        }
        if (!hasAnchorKey) {
          setActiveAnchorKey(null);
        }
      });
    };

    return mergeRegister(editor.registerUpdateListener(updateActiveIds), addClassToActiveMarkNodes());
  }, [activeIDs, editor, markNodeMap]);

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
