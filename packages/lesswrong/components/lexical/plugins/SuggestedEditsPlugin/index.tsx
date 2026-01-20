import type { Provider } from '@lexical/yjs';
import type { Doc } from 'yjs';

import React, { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  $addUpdateTag,
  $createRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getNodeByKey,
  $isElementNode,
  $isRootNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  DELETE_LINE_COMMAND,
  PASTE_COMMAND,
  DROP_COMMAND,
  HISTORY_MERGE_TAG,
  KEY_DOWN_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ESCAPE_COMMAND,
  createCommand,
  getDOMSelection,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  TextNode,
} from 'lexical';
import {
  $getMarkIDs,
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from '@lexical/mark';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import classNames from 'classnames';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/components/lexical/ui/Button';
import { useCurrentUser } from '@/components/common/withUser';
import { useClientId } from '@/components/hooks/useClientId';
import { accessLevelCan, type CollaborativeEditingAccessLevel } from '@/lib/collections/posts/collabEditingPermissions';
import {
  INSERT_INLINE_THREAD_COMMAND,
  RESOLVE_SUGGESTION_BY_ID_COMMAND,
  UPDATE_INLINE_THREAD_COMMAND,
} from '@/components/lexical/plugins/CommentPlugin';
import {
  SuggestionStore,
  SuggestionType,
  useSuggestionStore,
} from '@/components/lexical/suggestions';

const styles = defineStyles('LexicalSuggestedEditsPlugin', (theme: ThemeType) => ({
  suggestionActions: {
    position: 'fixed',
    zIndex: 30,
    background: theme.palette.grey[0],
    borderRadius: 6,
    padding: '6px 8px',
    boxShadow: `0 0 6px ${theme.palette.greyAlpha(0.2)}`,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  suggestionToggle: {
    position: 'fixed',
    right: 60,
    top: 80,
    zIndex: 30,
  },
  suggestionToggleButton: {
    backgroundColor: theme.palette.grey[200],
    borderRadius: 10,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  suggestionToggleActive: {
    backgroundColor: theme.palette.primary.light,
  },
  suggestionBadge: {
    display: 'inline-block',
    fontSize: 12,
    color: theme.palette.grey[700],
  },
}));

const SUGGESTION_ID_PREFIX = 'suggestion:';
type SuggestionMarkKind = 'insert' | 'delete';

type SuggestionAuthor = {
  id: string;
  name: string;
};

function getSuggestionAuthor(
  currentUser: ReturnType<typeof useCurrentUser>,
  clientId: string | undefined,
): SuggestionAuthor | null {
  if (currentUser?._id) {
    return {
      id: currentUser._id,
      name: currentUser.displayName ?? 'Anonymous',
    };
  }
  if (clientId) {
    return {
      id: clientId,
      name: 'Anonymous',
    };
  }
  return null;
}

function getSuggestionAuthorId(
  currentUser: ReturnType<typeof useCurrentUser>,
  clientId: string | undefined,
): string | null {
  return getSuggestionAuthor(currentUser, clientId)?.id ?? null;
}

function toSuggestionMarkId(id: string, kind: SuggestionMarkKind): string {
  return `${SUGGESTION_ID_PREFIX}${id}:${kind}`;
}

function parseSuggestionMarkId(id: string): { id: string; kind: SuggestionMarkKind } | null {
  if (!id.startsWith(SUGGESTION_ID_PREFIX)) return null;
  const rest = id.slice(SUGGESTION_ID_PREFIX.length);
  const [suggestionId, kind] = rest.split(':');
  if (!suggestionId) return null;
  if (kind === 'delete' || kind === 'insert') {
    return { id: suggestionId, kind };
  }
  return { id: suggestionId, kind: 'insert' };
}

function getSuggestionIdFromMarkIDs(ids: Array<string>): string | null {
  for (const id of ids) {
    const parsed = parseSuggestionMarkId(id);
    if (parsed) return parsed.id;
  }
  return null;
}

function getSelectionSuggestionId(): string | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const anchorNode = selection.anchor.getNode();
  if ($isElementNode(anchorNode)) {
    const childCandidates = [
      selection.anchor.offset > 0
        ? anchorNode.getChildAtIndex(selection.anchor.offset - 1)
        : null,
      anchorNode.getChildAtIndex(selection.anchor.offset),
    ];
    for (const child of childCandidates) {
      if (!child) continue;
      if ($isMarkNode(child)) {
        const suggestionId = getSuggestionIdFromMarkIDs(child.getIDs());
        if (suggestionId) return suggestionId;
      }
      if ($isTextNode(child)) {
        const childSize = child.getTextContentSize();
        const ids = childSize > 0 ? $getMarkIDs(child, childSize - 1) : null;
        const suggestionId = ids ? getSuggestionIdFromMarkIDs(ids) : null;
        if (suggestionId) return suggestionId;
      }
    }
    return null;
  }
  if (!$isTextNode(anchorNode)) return null;
  const anchorSize = anchorNode.getTextContentSize();
  if (selection.anchor.offset > anchorSize) return null;
  const anchorOffset = Math.min(selection.anchor.offset, anchorSize);
  let ids = $getMarkIDs(anchorNode, anchorOffset);
  if (!ids && anchorOffset > 0) {
    ids = $getMarkIDs(anchorNode, anchorOffset - 1);
  }
  if (!ids && anchorOffset === 0) {
    const previous = anchorNode.getPreviousSibling();
    let previousTextNode: ReturnType<typeof $getNodeByKey> | null = null;
    if ($isTextNode(previous)) {
      previousTextNode = previous;
    } else if ($isMarkNode(previous)) {
      const lastChild = previous.getLastChild();
      if ($isTextNode(lastChild)) {
        previousTextNode = lastChild;
      }
    }
    if ($isTextNode(previousTextNode)) {
      const previousSize = previousTextNode.getTextContentSize();
      if (previousSize > 0) {
        ids = $getMarkIDs(previousTextNode, previousSize - 1);
      }
    }
  }
  if (!ids && anchorOffset === anchorNode.getTextContentSize()) {
    const next = anchorNode.getNextSibling();
    let nextTextNode: ReturnType<typeof $getNodeByKey> | null = null;
    if ($isTextNode(next)) {
      nextTextNode = next;
    } else if ($isMarkNode(next)) {
      const firstChild = next.getFirstChild();
      if ($isTextNode(firstChild)) {
        nextTextNode = firstChild;
      }
    }
    if ($isTextNode(nextTextNode)) {
      ids = $getMarkIDs(nextTextNode, 0);
    }
  }
  if (!ids) return null;
  return getSuggestionIdFromMarkIDs(ids);
}

export const TOGGLE_SUGGESTION_MODE_COMMAND = createCommand<boolean>('TOGGLE_SUGGESTION_MODE_COMMAND');

type SuggestedEditsPluginProps = {
  accessLevel?: CollaborativeEditingAccessLevel;
  providerFactory?: (id: string, yjsDocMap: Map<string, Doc>) => Provider;
};

function getDefaultSuggestMode(accessLevel?: CollaborativeEditingAccessLevel): boolean {
  if (!accessLevel) return true;
  return !accessLevelCan(accessLevel, 'edit');
}

function markInsertedText(selectionText: string): ReturnType<typeof $createRangeSelection> | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const normalizedSelection = normalizeSelectionOffsets(selection);
  if (!normalizedSelection) return null;
  const anchorNode = normalizedSelection.anchor.getNode();
  if (!$isTextNode(anchorNode)) return null;
  const anchorSize = anchorNode.getTextContentSize();
  const endOffset = Math.min(normalizedSelection.anchor.offset, anchorSize);
  const startOffset = Math.max(0, endOffset - selectionText.length);
  if (startOffset < 0) return null;
  const range = $createRangeSelection();
  range.setTextNodeRange(anchorNode, startOffset, anchorNode, endOffset);
  return range;
}

function getDeleteRangeSelection(
  selection: ReturnType<typeof $createRangeSelection>,
  isBackward: boolean,
): ReturnType<typeof $createRangeSelection> | null {
  const normalizedSelection = normalizeSelectionOffsets(selection);
  if (!normalizedSelection) return null;
  if (!normalizedSelection.isCollapsed()) return normalizedSelection;
  normalizedSelection.modify('extend', isBackward, 'character');
  const extendedSelection = $getSelection();
  if ($isRangeSelection(extendedSelection) && !extendedSelection.isCollapsed()) {
    const normalizedExtended = normalizeSelectionOffsets(extendedSelection);
    if (normalizedExtended && !normalizedExtended.isCollapsed()) return normalizedExtended;
  }
  const anchorNode = normalizedSelection.anchor.getNode();
  if (!$isTextNode(anchorNode)) return null;
  const anchorOffset = normalizedSelection.anchor.offset;
  const anchorSize = anchorNode.getTextContentSize();
  const range = $createRangeSelection();
  if (isBackward) {
    if (anchorOffset > 0) {
      range.setTextNodeRange(anchorNode, anchorOffset - 1, anchorNode, anchorOffset);
      return range;
    }
    const previous = getPreviousTextNode(anchorNode);
    if (!previous) return null;
    const previousSize = previous.getTextContentSize();
    range.setTextNodeRange(
      previous,
      Math.max(previousSize - 1, 0),
      previous,
      previousSize,
    );
    return range;
  }
  if (anchorOffset < anchorSize) {
    range.setTextNodeRange(anchorNode, anchorOffset, anchorNode, anchorOffset + 1);
    return range;
  }
  const next = getNextTextNode(anchorNode);
  if (!next) return null;
  range.setTextNodeRange(next, 0, next, Math.min(1, next.getTextContentSize()));
  return range;
}

function collapseSelectionToEdge(edge: 'start' | 'end'): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const isBackward = selection.isBackward();
  const point =
    edge === 'start'
      ? (isBackward ? selection.focus : selection.anchor)
      : (isBackward ? selection.anchor : selection.focus);
  const pointNode = point.getNode();
  if ($isTextNode(pointNode)) {
    selection.setTextNodeRange(pointNode, point.offset, pointNode, point.offset);
    return;
  }
  if ($isElementNode(pointNode)) {
    const textNode =
      edge === 'start'
        ? getFirstTextDescendant(pointNode)
        : getLastTextDescendant(pointNode);
    if (!textNode) return;
    const offset = edge === 'start' ? 0 : textNode.getTextContentSize();
    selection.setTextNodeRange(textNode, offset, textNode, offset);
  }
}

function moveSelectionToEndOfMarkNode(markNode: MarkNode): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const lastChild = markNode.getLastChild();
  if (!$isTextNode(lastChild)) return;
  const offset = lastChild.getTextContentSize();
  selection.setTextNodeRange(lastChild, offset, lastChild, offset);
}

function moveSelectionBeforeNode(node: LexicalNode): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  if ($isTextNode(node)) {
    selection.setTextNodeRange(node, 0, node, 0);
    return;
  }
  if (!$isElementNode(node)) return;
  const firstText = getFirstTextDescendant(node);
  if (!firstText) return;
  const previous = getPreviousTextNode(firstText);
  if (previous) {
    const offset = previous.getTextContentSize();
    selection.setTextNodeRange(previous, offset, previous, offset);
    return;
  }
  const beforeNode = $createTextNode('');
  node.insertBefore(beforeNode);
  selection.setTextNodeRange(beforeNode, 0, beforeNode, 0);
}

function ensureTextNodeForEmptySelection(selection: ReturnType<typeof $createRangeSelection>): void {
  const anchorNode = selection.anchor.getNode();
  if ($isRootNode(anchorNode)) {
    const paragraph = $createParagraphNode();
    const textNode = $createTextNode('');
    paragraph.append(textNode);
    anchorNode.append(paragraph);
    selection.setTextNodeRange(textNode, 0, textNode, 0);
    return;
  }
  if ($isElementNode(anchorNode) && anchorNode.getChildrenSize() === 0) {
    const textNode = $createTextNode('');
    anchorNode.append(textNode);
    selection.setTextNodeRange(textNode, 0, textNode, 0);
    return;
  }
  const focusNode = selection.focus.getNode();
  if ($isElementNode(focusNode) && focusNode.getChildrenSize() === 0) {
    const textNode = $createTextNode('');
    focusNode.append(textNode);
    selection.setTextNodeRange(textNode, 0, textNode, 0);
  }
}

function getNextInsertSuggestionMarkFromSelection(
  selection: ReturnType<typeof $createRangeSelection>,
  suggestionStore: SuggestionStore,
  authorId: string,
): { markNode: MarkNode; suggestionId: string } | null {
  if (!selection.isCollapsed()) return null;
  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode)) return null;
  let nextSibling: ReturnType<typeof anchorNode.getNextSibling> | null = null;
  const anchorMark = getParentMarkNode(anchorNode);
  if (anchorMark) {
    const hasInsertSuggestion = anchorMark
      .getIDs()
      .some((id) => parseSuggestionMarkId(id)?.kind === 'insert');
    if (hasInsertSuggestion) return null;
    const lastText = getLastTextDescendant(anchorMark);
    if (lastText !== anchorNode) return null;
    if (selection.anchor.offset !== anchorNode.getTextContentSize()) return null;
    nextSibling = anchorMark.getNextSibling();
  } else {
    if (selection.anchor.offset !== anchorNode.getTextContentSize()) return null;
    nextSibling = anchorNode.getNextSibling();
  }
  if (!$isMarkNode(nextSibling)) return null;
  const suggestionId = getSuggestionIdFromMarkIDs(nextSibling.getIDs());
  if (!suggestionId) return null;
  const suggestion = suggestionStore.getSuggestion(suggestionId);
  if (!suggestion || suggestion.state !== 'open' || suggestion.type !== 'insert') return null;
  if (suggestion.authorId !== authorId) return null;
  if (!nextSibling.getIDs().includes(toSuggestionMarkId(suggestionId, 'insert'))) return null;
  return { markNode: nextSibling, suggestionId };
}

function isSelectionAtStartOfMark(
  selection: ReturnType<typeof $createRangeSelection>,
  markNode: MarkNode,
): boolean {
  if (!selection.isCollapsed()) return false;
  const firstText = getFirstTextDescendant(markNode);
  if (!firstText) return false;
  return selection.anchor.getNode() === firstText && selection.anchor.offset === 0;
}

function markIdsEqual(a: string[], b: string[]): boolean {
  if (a.length === b.length && a.every((id) => b.includes(id))) return true;
  const aSuggestionMarks = a
    .map((id) => parseSuggestionMarkId(id))
    .filter((parsed): parsed is { id: string; kind: SuggestionMarkKind } => !!parsed)
    .map((parsed) => `${parsed.id}:${parsed.kind}`);
  const bSuggestionMarks = b
    .map((id) => parseSuggestionMarkId(id))
    .filter((parsed): parsed is { id: string; kind: SuggestionMarkKind } => !!parsed)
    .map((parsed) => `${parsed.id}:${parsed.kind}`);
  if (aSuggestionMarks.length !== bSuggestionMarks.length) return false;
  return aSuggestionMarks.every((id) => bSuggestionMarks.includes(id));
}

function mergeAdjacentMarkNodes(markNode: MarkNode): MarkNode {
  let result = markNode;
  let didMerge = true;
  while (didMerge) {
    didMerge = false;
    const previous = result.getPreviousSibling();
    if ($isMarkNode(previous) && markIdsEqual(previous.getIDs(), result.getIDs())) {
      previous.append(...result.getChildren());
      result.remove();
      result = previous;
      didMerge = true;
      continue;
    }
    const next = result.getNextSibling();
    if ($isMarkNode(next) && markIdsEqual(next.getIDs(), result.getIDs())) {
      result.append(...next.getChildren());
      next.remove();
      didMerge = true;
    }
  }
  return result;
}

function getClosestNonMarkElement(node: ReturnType<typeof $getNodeByKey>): ElementNode | null {
  let current = node;
  while (current) {
    if ($isElementNode(current) && !$isMarkNode(current)) return current;
    current = current.getParent();
  }
  return null;
}

function mergeAdjacentMarkNodesInParent(parent: ElementNode): void {
  let child = parent.getFirstChild();
  while (child) {
    if ($isMarkNode(child)) {
      let next = child.getNextSibling();
      while ($isMarkNode(next) && markIdsEqual(next.getIDs(), child.getIDs())) {
        child.append(...next.getChildren());
        const nextToCheck = next.getNextSibling();
        next.remove();
        next = nextToCheck;
      }
    }
    child = child.getNextSibling();
  }
}

function mergeAdjacentMarkNodesForId(
  markId: string,
  range?: ReturnType<typeof $getSelection>,
): void {
  const selection = range ?? $getSelection();
  if (!$isRangeSelection(selection)) return;
  let nodes: ReturnType<typeof selection.getNodes> = [];
  try {
    nodes = selection.getNodes();
  } catch {
    return;
  }
  const markNodes = new Set<MarkNode>();
  nodes.forEach((node) => {
    if ($isMarkNode(node) && node.getIDs().includes(markId)) {
      markNodes.add(node);
      return;
    }
    const parent = getParentMarkNode(node);
    if (parent && parent.getIDs().includes(markId)) {
      markNodes.add(parent);
    }
  });
  markNodes.forEach((node) => {
    mergeAdjacentMarkNodes(node);
  });
}

function getParentMarkNode(node: ReturnType<typeof $getNodeByKey>): MarkNode | null {
  let current = node;
  while (current) {
    if ($isMarkNode(current)) return current;
    current = current.getParent();
  }
  return null;
}

function findAdjacentMarkNodeWithId(
  node: ReturnType<typeof $getNodeByKey> | null,
  markId: string,
): MarkNode | null {
  if (!node) return null;
  const siblings = [node.getPreviousSibling(), node.getNextSibling()];
  for (const sibling of siblings) {
    if ($isMarkNode(sibling) && sibling.getIDs().includes(markId)) {
      return sibling;
    }
  }
  const parent = node.getParent();
  if (parent && !$isMarkNode(parent)) {
    const parentSiblings = [parent.getPreviousSibling(), parent.getNextSibling()];
    for (const sibling of parentSiblings) {
      if ($isMarkNode(sibling) && sibling.getIDs().includes(markId)) {
        return sibling;
      }
    }
  }
  return null;
}

function getMarkNodeForSuggestionFromSelection(
  selection: ReturnType<typeof $getSelection>,
  suggestionId: string,
  kind: SuggestionMarkKind,
): MarkNode | null {
  if (!$isRangeSelection(selection)) return null;
  const markId = toSuggestionMarkId(suggestionId, kind);
  const anchorNode = selection.anchor.getNode();
  const anchorParent = getParentMarkNode(anchorNode);
  if (anchorParent && anchorParent.getIDs().includes(markId)) return anchorParent;
  const anchorAdjacent = findAdjacentMarkNodeWithId(anchorNode, markId);
  if (anchorAdjacent) return anchorAdjacent;
  const focusNode = selection.focus.getNode();
  if (focusNode === anchorNode) return null;
  const focusParent = getParentMarkNode(focusNode);
  if (focusParent && focusParent.getIDs().includes(markId)) return focusParent;
  return findAdjacentMarkNodeWithId(focusNode, markId);
}

function getMarkNodeForSuggestionFromRange(
  range: ReturnType<typeof $createRangeSelection>,
  suggestionId: string,
  kind: SuggestionMarkKind,
): MarkNode | null {
  const markId = toSuggestionMarkId(suggestionId, kind);
  const anchorNode = range.anchor.getNode();
  const anchorParent = getParentMarkNode(anchorNode);
  if (anchorParent && anchorParent.getIDs().includes(markId)) return anchorParent;
  const anchorAdjacent = findAdjacentMarkNodeWithId(anchorNode, markId);
  if (anchorAdjacent) return anchorAdjacent;
  const focusNode = range.focus.getNode();
  if (focusNode === anchorNode) return null;
  const focusParent = getParentMarkNode(focusNode);
  if (focusParent && focusParent.getIDs().includes(markId)) return focusParent;
  return findAdjacentMarkNodeWithId(focusNode, markId);
}

function getFirstTextDescendant(node: ElementNode): TextNode | null {
  let current: ReturnType<typeof node.getFirstChild> | null = node.getFirstChild();
  while (current) {
    if ($isTextNode(current)) return current;
    if ($isElementNode(current)) {
      const child = getFirstTextDescendant(current);
      if (child) return child;
    }
    current = current.getNextSibling();
  }
  return null;
}

function getLastTextDescendant(node: ElementNode): TextNode | null {
  let current: ReturnType<typeof node.getLastChild> | null = node.getLastChild();
  while (current) {
    if ($isTextNode(current)) return current;
    if ($isElementNode(current)) {
      const child = getLastTextDescendant(current);
      if (child) return child;
    }
    current = current.getPreviousSibling();
  }
  return null;
}

function getPreviousTextNode(node: LexicalNode): TextNode | null {
  let current: LexicalNode | null = node;
  while (current) {
    const previous: LexicalNode | null = current.getPreviousSibling();
    if (previous) {
      if ($isTextNode(previous)) return previous;
      if ($isElementNode(previous)) {
        const child = getLastTextDescendant(previous);
        if (child) return child;
      }
      current = previous;
      continue;
    }
    current = current.getParent();
  }
  return null;
}

function getNextTextNode(node: LexicalNode): TextNode | null {
  let current: LexicalNode | null = node;
  while (current) {
    const next: LexicalNode | null = current.getNextSibling();
    if (next) {
      if ($isTextNode(next)) return next;
      if ($isElementNode(next)) {
        const child = getFirstTextDescendant(next);
        if (child) return child;
      }
      current = next;
      continue;
    }
    current = current.getParent();
  }
  return null;
}

function getRangeSelectionForMarkNode(
  markNode: MarkNode,
): ReturnType<typeof $createRangeSelection> | null {
  const startNode = getFirstTextDescendant(markNode);
  const endNode = getLastTextDescendant(markNode);
  if (!startNode || !endNode) return null;
  const range = $createRangeSelection();
  range.setTextNodeRange(startNode, 0, endNode, endNode.getTextContentSize());
  return range;
}

function getSuggestionTextFromMarkNodeMap(
  suggestionId: string,
  markNodeMap: Map<string, Set<string>>,
): string | null {
  const keys = markNodeMap.get(suggestionId);
  if (!keys || keys.size === 0) return null;
  const parts: Array<{ order: number; text: string }> = [];
  for (const key of keys) {
    const node = $getNodeByKey<MarkNode>(key);
    if (!$isMarkNode(node)) continue;
    parts.push({ order: node.getIndexWithinParent(), text: node.getTextContent() });
  }
  if (parts.length === 0) return null;
  return parts
    .sort((a, b) => a.order - b.order)
    .map((part) => part.text)
    .join('');
}

function getSuggestionTextFromEditorState(
  suggestionId: string,
  kind: SuggestionMarkKind,
): string | null {
  const markId = toSuggestionMarkId(suggestionId, kind);
  const root = $getRoot();
  const parts: Array<{ order: number; text: string }> = [];
  const stack: Array<ElementNode> = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if ($isMarkNode(node) && node.getIDs().includes(markId)) {
      parts.push({ order: node.getIndexWithinParent(), text: node.getTextContent() });
    }
    const children = node.getChildren();
    for (const child of children) {
      if ($isElementNode(child)) {
        stack.push(child);
      }
    }
  }
  if (parts.length === 0) return null;
  return parts
    .sort((a, b) => a.order - b.order)
    .map((part) => part.text)
    .join('');
}

function applySuggestionMark(
  selection: ReturnType<typeof $getSelection>,
  suggestionId: string,
  kind: SuggestionMarkKind,
): void {
  if (!$isRangeSelection(selection)) return;
  const normalizedSelection = normalizeSelectionOffsets(selection);
  if (!normalizedSelection) return;
  const isBackward = normalizedSelection.isBackward();
  $addUpdateTag(HISTORY_MERGE_TAG);
  $wrapSelectionInMarkNode(
    normalizedSelection,
    isBackward,
    toSuggestionMarkId(suggestionId, kind),
  );
}

type SelectionSnapshot = {
  anchorKey: string;
  anchorOffset: number;
  focusKey: string;
  focusOffset: number;
};

function snapshotSelection(selection: ReturnType<typeof $getSelection>): SelectionSnapshot | null {
  if (!$isRangeSelection(selection)) return null;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return null;
  return {
    anchorKey: anchorNode.getKey(),
    anchorOffset: selection.anchor.offset,
    focusKey: focusNode.getKey(),
    focusOffset: selection.focus.offset,
  };
}

function selectionSnapshotsEqual(a: SelectionSnapshot, b: SelectionSnapshot): boolean {
  return (
    a.anchorKey === b.anchorKey &&
    a.anchorOffset === b.anchorOffset &&
    a.focusKey === b.focusKey &&
    a.focusOffset === b.focusOffset
  );
}

function restoreSelectionFromSnapshot(snapshot: SelectionSnapshot): void {
  const anchorNode = $getNodeByKey(snapshot.anchorKey);
  const focusNode = $getNodeByKey(snapshot.focusKey);
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return;
  const anchorSize = anchorNode.getTextContentSize();
  const focusSize = focusNode.getTextContentSize();
  const anchorOffset = Math.min(snapshot.anchorOffset, anchorSize);
  const focusOffset = Math.min(snapshot.focusOffset, focusSize);
  const range = $createRangeSelection();
  range.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset);
  $setSelection(range);
}

type ResolvedPoint = {
  node: TextNode;
  offset: number;
};

type SelectionPoint = {
  getNode: () => ReturnType<typeof $getNodeByKey>;
  offset: number;
};

function resolvePointToTextNode(
  point: SelectionPoint,
  preferEnd: boolean,
): ResolvedPoint | null {
  const pointNode = point.getNode();
  if ($isTextNode(pointNode)) {
    const size = pointNode.getTextContentSize();
    const offset = Math.min(point.offset, size);
    return { node: pointNode, offset };
  }
  if (!$isElementNode(pointNode)) return null;
  const children = pointNode.getChildren();
  if (children.length === 0) return null;
  const index = Math.min(
    Math.max(point.offset - (preferEnd ? 1 : 0), 0),
    children.length - 1,
  );
  const child = children[index];
  if ($isTextNode(child)) {
    return { node: child, offset: preferEnd ? child.getTextContentSize() : 0 };
  }
  if ($isElementNode(child)) {
    const textNode = preferEnd ? getLastTextDescendant(child) : getFirstTextDescendant(child);
    if (textNode) {
      return { node: textNode, offset: preferEnd ? textNode.getTextContentSize() : 0 };
    }
  }
  return null;
}

function normalizeSelectionOffsets(
  selection: ReturnType<typeof $createRangeSelection>,
): ReturnType<typeof $createRangeSelection> | null {
  if (selection.isCollapsed()) {
    const preferEnd = selection.anchor.offset > 0;
    const resolved = resolvePointToTextNode(selection.anchor, preferEnd);
    if (!resolved) return null;
    const range = $createRangeSelection();
    range.setTextNodeRange(resolved.node, resolved.offset, resolved.node, resolved.offset);
    $setSelection(range);
    return range;
  }
  const anchor = resolvePointToTextNode(selection.anchor, false);
  const focus = resolvePointToTextNode(selection.focus, true);
  if (!anchor || !focus) return null;
  const range = $createRangeSelection();
  range.setTextNodeRange(anchor.node, anchor.offset, focus.node, focus.offset);
  $setSelection(range);
  return range;
}

function normalizeSelectionOffsetsReadOnly(
  selection: ReturnType<typeof $createRangeSelection>,
): ReturnType<typeof $createRangeSelection> | null {
  if (selection.isCollapsed()) {
    const preferEnd = selection.anchor.offset > 0;
    const resolved = resolvePointToTextNode(selection.anchor, preferEnd);
    if (!resolved) return null;
    const range = $createRangeSelection();
    range.setTextNodeRange(resolved.node, resolved.offset, resolved.node, resolved.offset);
    return range;
  }
  const anchor = resolvePointToTextNode(selection.anchor, false);
  const focus = resolvePointToTextNode(selection.focus, true);
  if (!anchor || !focus) return null;
  const range = $createRangeSelection();
  range.setTextNodeRange(anchor.node, anchor.offset, focus.node, focus.offset);
  return range;
}

function isSafeCollapsedSelection(
  selection: ReturnType<typeof $createRangeSelection>,
): boolean {
  if (!selection.isCollapsed()) return false;
  const anchorNode = $getNodeByKey(selection.anchor.key);
  const focusNode = $getNodeByKey(selection.focus.key);
  if ($isElementNode(anchorNode) && $isElementNode(focusNode)) {
    return true;
  }
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return false;
  if (selection.anchor.offset > anchorNode.getTextContentSize()) return false;
  if (selection.focus.offset > focusNode.getTextContentSize()) return false;
  return true;
}

function updateSuggestionThread(
  editor: LexicalEditor,
  suggestionId: string,
  text: string | null,
): void {
  if (!text) return;
  editor.dispatchCommand(UPDATE_INLINE_THREAD_COMMAND, {
    threadId: suggestionId,
    quote: text,
    firstCommentContent: text,
  });
}

function createSuggestionThreadForSelection(
  editor: LexicalEditor,
  selection: ReturnType<typeof $getSelection>,
  payload: {
    threadId: string;
    initialContent: string;
    quote: string;
    isSuggestion: boolean;
  },
  updatedText: string | null,
): void {
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return;
  const selectionSnapshot = snapshotSelection(selection);
  editor.dispatchCommand(INSERT_INLINE_THREAD_COMMAND, {
    ...payload,
    selectionSnapshot: selectionSnapshot ?? undefined,
  });
  updateSuggestionThread(editor, payload.threadId, updatedText ?? payload.quote);
}

export default function SuggestedEditsPlugin({
  accessLevel,
  providerFactory,
}: SuggestedEditsPluginProps): JSX.Element | null {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const collabContext = useCollaborationContext();
  const { yjsDocMap } = collabContext;
  const suggestionStore = useMemo(() => new SuggestionStore(editor), [editor]);
  const suggestions = useSuggestionStore(suggestionStore);
  const [suggestMode, setSuggestMode] = useState(() => getDefaultSuggestMode(accessLevel));
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [actionAnchorRect, setActionAnchorRect] = useState<DOMRect | null>(null);
  const markNodeMap = useMemo<Map<string, Set<string>>>(() => new Map(), []);
  const decoratedKeysRef = useRef<Set<string>>(new Set());
  const lastInsertSuggestionIdRef = useRef<string | null>(null);
  const lastReplaceSuggestionIdRef = useRef<string | null>(null);
  const lastInsertSelectionRef = useRef<SelectionSnapshot | null>(null);
  const lastThreadTextRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (providerFactory) {
      const provider = providerFactory('suggestions', yjsDocMap);
      return suggestionStore.registerCollaboration(provider);
    }
    return undefined;
  }, [providerFactory, suggestionStore, yjsDocMap]);

  const canAccept = useMemo(() => {
    if (accessLevel && accessLevelCan(accessLevel, 'edit')) return true;
    return false;
  }, [accessLevel]);

  const canReject = useCallback((suggestionId: string | null) => {
    if (!suggestionId) return false;
    if (canAccept) return true;
    const suggestion = suggestionStore.getSuggestion(suggestionId);
    if (!suggestion) return false;
    const authorId = getSuggestionAuthorId(currentUser, clientId);
    return suggestion.authorId === authorId;
  }, [canAccept, clientId, currentUser, suggestionStore]);

  const getMergeableSuggestionId = useCallback((type: SuggestionType): string | null => {
    const suggestionId = editor.getEditorState().read(() => getSelectionSuggestionId());
    if (!suggestionId) return null;
    const suggestion = suggestionStore.getSuggestion(suggestionId);
    if (!suggestion) return null;
    if (suggestion.state !== 'open') return null;
    if (suggestion.type !== type) return null;
    const authorId = getSuggestionAuthorId(currentUser, clientId);
    if (!authorId || suggestion.authorId !== authorId) return null;
    return suggestionId;
  }, [clientId, currentUser, editor, suggestionStore]);

  const createSuggestionRecord = useCallback((type: SuggestionType) => {
    const author = getSuggestionAuthor(currentUser, clientId);
    if (!author) return null;
    const record = suggestionStore.createSuggestion({
      authorId: author.id,
      authorName: author.name,
      state: 'open',
      type,
    });
    return record;
  }, [clientId, currentUser, suggestionStore]);

  const handleInsertText = useCallback((text: string) => {
    if (!suggestMode) return false;
    const authorId = getSuggestionAuthorId(currentUser, clientId);
    if (!authorId) return false;
    if (!text) return false;
    const moveOutOfInsertMarkKey = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
      const normalizedSelection = normalizeSelectionOffsetsReadOnly(selection);
      if (!normalizedSelection) return null;
      const parentMark = getParentMarkNode(normalizedSelection.anchor.getNode());
      const suggestionId = parentMark ? getSuggestionIdFromMarkIDs(parentMark.getIDs()) : null;
      if (!suggestionId) return null;
      const suggestion = suggestionStore.getSuggestion(suggestionId);
      if (!suggestion || suggestion.state !== 'open' || suggestion.type !== 'insert') return null;
      if (suggestion.authorId !== authorId) return null;
      const markNode =
        parentMark ??
        getMarkNodeForSuggestionFromSelection(normalizedSelection, suggestionId, 'insert');
      if (!markNode) return null;
      if (!markNode.getIDs().includes(toSuggestionMarkId(suggestionId, 'insert'))) return null;
      return isSelectionAtStartOfMark(normalizedSelection, markNode) ? markNode.getKey() : null;
    });
  const leadingEdgeData = editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
    const normalizedSelection = normalizeSelectionOffsetsReadOnly(selection);
    if (!normalizedSelection) return null;
    const nextInsertMark = getNextInsertSuggestionMarkFromSelection(
      normalizedSelection,
      suggestionStore,
      authorId,
    );
    return nextInsertMark
      ? { markKey: nextInsertMark.markNode.getKey(), suggestionId: nextInsertMark.suggestionId }
      : null;
  });
    const currentSelectionSnapshot = editor.getEditorState().read(() =>
      snapshotSelection($getSelection()),
    );
    const canUseFallback =
      !!currentSelectionSnapshot &&
      !!lastInsertSelectionRef.current &&
      selectionSnapshotsEqual(currentSelectionSnapshot, lastInsertSelectionRef.current);
    const isReplace = editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? !isSafeCollapsedSelection(selection) : false;
    });
    const replaceInsertSuggestionId = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
      const suggestionId = getSelectionSuggestionId();
      if (!suggestionId) return null;
      const suggestion = suggestionStore.getSuggestion(suggestionId);
      if (!suggestion || suggestion.state !== 'open' || suggestion.type !== 'replace') return null;
      if (suggestion.authorId !== authorId) return null;
      const markNode = getMarkNodeForSuggestionFromSelection(selection, suggestionId, 'insert');
      return markNode ? suggestionId : null;
    });
    const replaceContinuationSuggestionId = editor.getEditorState().read(() => {
      const fallbackId = lastReplaceSuggestionIdRef.current;
      if (!fallbackId) return null;
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
      const suggestion = suggestionStore.getSuggestion(fallbackId);
      if (!suggestion || suggestion.state !== 'open' || suggestion.type !== 'replace') return null;
      if (suggestion.authorId !== authorId) return null;
      const markNode = getMarkNodeForSuggestionFromSelection(selection, fallbackId, 'insert');
      return markNode ? fallbackId : null;
    });
    const type: SuggestionType =
      replaceInsertSuggestionId || replaceContinuationSuggestionId
        ? 'replace'
        : isReplace
          ? 'replace'
          : 'insert';
  const existingInsertSuggestionId = (() => {
      if (replaceInsertSuggestionId) return replaceInsertSuggestionId;
      if (replaceContinuationSuggestionId) return replaceContinuationSuggestionId;
      if (type !== 'insert') return null;
    if (moveOutOfInsertMarkKey || leadingEdgeData) return null;
      if (!currentSelectionSnapshot) return null;
      const selectionSuggestionId = editor.getEditorState().read(() =>
        getSelectionSuggestionId(),
      );
      if (!selectionSuggestionId) return null;
      const suggestion = suggestionStore.getSuggestion(selectionSuggestionId);
      if (!suggestion || suggestion.state !== 'open' || suggestion.type !== 'insert') return null;
      if (suggestion.authorId !== authorId) return null;
      return selectionSuggestionId;
    })();
  const mergeSuggestionId = moveOutOfInsertMarkKey
    ? null
    : leadingEdgeData
      ? leadingEdgeData.suggestionId
      : existingInsertSuggestionId ?? getMergeableSuggestionId(type) ?? (() => {
      if (type !== 'insert') return null;
      const fallbackId = lastInsertSuggestionIdRef.current;
      if (!fallbackId) return null;
      const suggestion = suggestionStore.getSuggestion(fallbackId);
      if (!suggestion || suggestion.state !== 'open' || suggestion.type !== 'insert') return null;
      if (suggestion.authorId !== authorId) return null;
      const canMergeWithFallback =
        canUseFallback ||
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
          return !!getMarkNodeForSuggestionFromSelection(selection, fallbackId, 'insert');
        });
      if (!canMergeWithFallback) return null;
      return fallbackId;
    })();
    const record = mergeSuggestionId ? null : createSuggestionRecord(type);
    if (!mergeSuggestionId && !record) return false;
    const suggestionId = mergeSuggestionId ?? record!.id;
    const shouldCreateThread = !mergeSuggestionId;

    let didCreateThread = false;
    let updatedSuggestionText: string | null = null;
    let didInsertText = false;
  editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      ensureTextNodeForEmptySelection(selection);
    if (leadingEdgeData) {
      const markNode = $getNodeByKey(leadingEdgeData.markKey);
      if ($isMarkNode(markNode)) {
        const firstText = getFirstTextDescendant(markNode);
        if (firstText) {
          const insertSelection = $createRangeSelection();
          insertSelection.setTextNodeRange(firstText, 0, firstText, 0);
          $setSelection(insertSelection);
        }
      }
    }
    const moveOutKey = moveOutOfInsertMarkKey;
    if (moveOutKey) {
      const markNode = $getNodeByKey(moveOutKey);
        if ($isMarkNode(markNode)) {
          const insertNode = $createTextNode(text);
          markNode.insertBefore(insertNode);
          const insertSelection = $createRangeSelection();
          insertSelection.setTextNodeRange(insertNode, text.length, insertNode, text.length);
          $setSelection(insertSelection);
          didInsertText = true;
          const range = markInsertedText(text);
          if (!range) return;
          applySuggestionMark(range, suggestionId, 'insert');
          mergeAdjacentMarkNodesForId(toSuggestionMarkId(suggestionId, 'insert'), range);
          const parentElement = getClosestNonMarkElement(range.anchor.getNode());
          if (parentElement) {
            mergeAdjacentMarkNodesInParent(parentElement);
          }
          const nextMarkNode =
            getParentMarkNode(range.anchor.getNode()) ??
            getMarkNodeForSuggestionFromRange(range, suggestionId, 'insert') ??
            getMarkNodeForSuggestionFromSelection($getSelection(), suggestionId, 'insert');
          if (nextMarkNode) {
            const mergedMarkNode = mergeAdjacentMarkNodes(nextMarkNode);
            updatedSuggestionText = mergedMarkNode.getTextContent();
            moveSelectionToEndOfMarkNode(mergedMarkNode);
          }
          if (!updatedSuggestionText) {
            updatedSuggestionText = getSuggestionTextFromMarkNodeMap(suggestionId, markNodeMap);
          }
          if (!updatedSuggestionText) {
            updatedSuggestionText = getSuggestionTextFromEditorState(suggestionId, 'insert');
          }
          if (shouldCreateThread && !didCreateThread) {
            const threadRange = nextMarkNode
              ? getRangeSelectionForMarkNode(nextMarkNode) ?? range
              : range;
            $setSelection(threadRange);
            createSuggestionThreadForSelection(
              editor,
              threadRange,
              {
                threadId: suggestionId,
                initialContent: isReplace ? 'Suggested replacement' : 'Suggested edit',
                quote: text,
                isSuggestion: true,
              },
              updatedSuggestionText,
            );
            didCreateThread = true;
          }
          lastInsertSelectionRef.current = snapshotSelection($getSelection());
          return;
        }
      }
      const rangeSelection = normalizeSelectionOffsets(selection);
      if (!rangeSelection) return;
      if (existingInsertSuggestionId && rangeSelection.isCollapsed()) {
        const shouldMoveSelectionToEnd = (() => {
          const markNode = getMarkNodeForSuggestionFromSelection(
            rangeSelection,
            existingInsertSuggestionId,
            'insert',
          );
          if (!markNode) return false;
          const lastText = getLastTextDescendant(markNode);
          if (!lastText) return false;
          return (
            rangeSelection.anchor.getNode() === lastText &&
            rangeSelection.anchor.offset === lastText.getTextContentSize()
          );
        })();
        const anchorNode = rangeSelection.anchor.getNode();
        if ($isTextNode(anchorNode)) {
          const atEnd = rangeSelection.anchor.offset === anchorNode.getTextContentSize();
          const nextSibling = anchorNode.getNextSibling();
          if (
            atEnd &&
            $isMarkNode(nextSibling) &&
            nextSibling
              .getIDs()
              .includes(toSuggestionMarkId(existingInsertSuggestionId, 'insert'))
          ) {
            moveSelectionToEndOfMarkNode(nextSibling);
          }
        }
        rangeSelection.insertText(text);
        didInsertText = true;
        const range = markInsertedText(text);
        if (range) {
          applySuggestionMark(range, existingInsertSuggestionId, 'insert');
          mergeAdjacentMarkNodesForId(
            toSuggestionMarkId(existingInsertSuggestionId, 'insert'),
            range,
          );
          const parentElement = getClosestNonMarkElement(range.anchor.getNode());
          if (parentElement) {
            mergeAdjacentMarkNodesInParent(parentElement);
          }
          const markNode =
            getParentMarkNode(range.anchor.getNode()) ??
            getMarkNodeForSuggestionFromRange(range, existingInsertSuggestionId, 'insert') ??
            getMarkNodeForSuggestionFromSelection($getSelection(), existingInsertSuggestionId, 'insert');
          if (markNode) {
            const mergedMarkNode = mergeAdjacentMarkNodes(markNode);
            updatedSuggestionText = mergedMarkNode.getTextContent();
            if (shouldMoveSelectionToEnd) {
              moveSelectionToEndOfMarkNode(mergedMarkNode);
            }
          }
          if (!updatedSuggestionText) {
            updatedSuggestionText = getSuggestionTextFromMarkNodeMap(
              existingInsertSuggestionId,
              markNodeMap,
            );
          }
          if (!updatedSuggestionText) {
            updatedSuggestionText = getSuggestionTextFromEditorState(
              existingInsertSuggestionId,
              'insert',
            );
          }
          if (shouldCreateThread && !didCreateThread) {
            const threadRange = markNode
              ? getRangeSelectionForMarkNode(markNode) ?? range
              : range;
            $setSelection(threadRange);
            createSuggestionThreadForSelection(
              editor,
              threadRange,
              {
                threadId: suggestionId,
                initialContent: isReplace ? 'Suggested replacement' : 'Suggested edit',
                quote: text,
                isSuggestion: true,
              },
              updatedSuggestionText,
            );
            didCreateThread = true;
          }
        }
        lastInsertSelectionRef.current = snapshotSelection($getSelection());
        return;
      }
      if (record) {
        suggestionStore.addSuggestion(record);
      }
      if (!rangeSelection.isCollapsed()) {
        applySuggestionMark(rangeSelection, suggestionId, 'delete');
        const endPoint = rangeSelection.isBackward()
          ? rangeSelection.anchor
          : rangeSelection.focus;
        const endNode = endPoint.getNode();
        if ($isTextNode(endNode)) {
          rangeSelection.setTextNodeRange(endNode, endPoint.offset, endNode, endPoint.offset);
        }
      }

      const selectionForInsert = $getSelection();
      if (!$isRangeSelection(selectionForInsert)) return;
      const normalizedSelectionForInsert = normalizeSelectionOffsets(selectionForInsert);
      if (!normalizedSelectionForInsert) return;
      normalizedSelectionForInsert.insertText(text);
      didInsertText = true;
      const range = markInsertedText(text);
      if (!range) return;
      applySuggestionMark(range, suggestionId, 'insert');
      mergeAdjacentMarkNodesForId(toSuggestionMarkId(suggestionId, 'insert'), range);
      const parentElement = getClosestNonMarkElement(range.anchor.getNode());
      if (parentElement) {
        mergeAdjacentMarkNodesInParent(parentElement);
      }
      const markNode =
        getParentMarkNode(range.anchor.getNode()) ??
        getMarkNodeForSuggestionFromRange(range, suggestionId, 'insert') ??
        getMarkNodeForSuggestionFromSelection($getSelection(), suggestionId, 'insert');
      if (markNode) {
        const mergedMarkNode = mergeAdjacentMarkNodes(markNode);
        updatedSuggestionText = mergedMarkNode.getTextContent();
        if (shouldCreateThread) {
          moveSelectionToEndOfMarkNode(mergedMarkNode);
        }
      }
      if (!updatedSuggestionText) {
        updatedSuggestionText = getSuggestionTextFromMarkNodeMap(suggestionId, markNodeMap);
      }
      if (!updatedSuggestionText) {
        updatedSuggestionText = getSuggestionTextFromEditorState(suggestionId, 'insert');
      }
      if (shouldCreateThread && !didCreateThread) {
        const threadRange = markNode ? getRangeSelectionForMarkNode(markNode) ?? range : range;
        $setSelection(threadRange);
        createSuggestionThreadForSelection(
          editor,
          threadRange,
          {
            threadId: suggestionId,
            initialContent: isReplace ? 'Suggested replacement' : 'Suggested edit',
            quote: text,
            isSuggestion: true,
          },
          updatedSuggestionText,
        );
        didCreateThread = true;
      }
      lastInsertSelectionRef.current = snapshotSelection($getSelection());
    });

    if (!shouldCreateThread) {
      queueMicrotask(() => {
        const nextSuggestionText =
          updatedSuggestionText ??
          editor.getEditorState().read(() =>
            getSuggestionTextFromEditorState(suggestionId, 'insert') ??
            getSuggestionTextFromMarkNodeMap(suggestionId, markNodeMap),
          );
        updateSuggestionThread(editor, suggestionId, nextSuggestionText);
      });
    }
    if (didInsertText) {
      lastInsertSuggestionIdRef.current = suggestionId;
      if (type === 'replace') {
        lastReplaceSuggestionIdRef.current = suggestionId;
      }
    }
    return true;
  }, [
    clientId,
    createSuggestionRecord,
    currentUser,
    editor,
    getMergeableSuggestionId,
    markNodeMap,
    suggestMode,
    suggestionStore,
  ]);

  const handleDelete = useCallback((isBackward: boolean) => {
    if (!suggestMode) return false;
    const authorId = getSuggestionAuthorId(currentUser, clientId);
    if (!authorId) return false;
    const replaceDeleteMarkKey = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
      const suggestionId = getSelectionSuggestionId();
      if (!suggestionId) return null;
      const suggestion = suggestionStore.getSuggestion(suggestionId);
      if (!suggestion || suggestion.type !== 'replace' || suggestion.state !== 'open') return null;
      const markNode = getMarkNodeForSuggestionFromSelection(selection, suggestionId, 'delete');
      return markNode ? markNode.getKey() : null;
    });
    if (replaceDeleteMarkKey) {
      editor.update(() => {
        const markNode = $getNodeByKey(replaceDeleteMarkKey);
        if (!$isMarkNode(markNode)) return;
        if (isBackward) {
          moveSelectionBeforeNode(markNode);
        } else {
          moveSelectionToEndOfMarkNode(markNode);
        }
      });
      return true;
    }
    const bypassSuggestionId = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
      const suggestionId = getSelectionSuggestionId();
      if (!suggestionId) return false;
      const suggestion = suggestionStore.getSuggestion(suggestionId);
      if (suggestion?.type !== 'insert' || suggestion.authorId !== authorId) return null;
      const normalizedSelection = normalizeSelectionOffsetsReadOnly(selection);
      const markNode =
        (normalizedSelection &&
          getMarkNodeForSuggestionFromSelection(normalizedSelection, suggestionId, 'insert')) ??
        getMarkNodeForSuggestionFromSelection(selection, suggestionId, 'insert');
      if (normalizedSelection) {
        const nextInsertMark = getNextInsertSuggestionMarkFromSelection(
          normalizedSelection,
          suggestionStore,
          authorId,
        );
        if (nextInsertMark && nextInsertMark.suggestionId === suggestionId) return null;
      }
      if (markNode && normalizedSelection && isSelectionAtStartOfMark(normalizedSelection, markNode)) {
        return null;
      }
      return suggestionId;
    });
    if (bypassSuggestionId) {
      queueMicrotask(() => {
        const nextSuggestionText = editor.getEditorState().read(() =>
          getSuggestionTextFromEditorState(bypassSuggestionId, 'insert'),
        );
        updateSuggestionThread(editor, bypassSuggestionId, nextSuggestionText);
      });
      return false;
    }
    let selectedText = '';
    const mergeSuggestionId = getMergeableSuggestionId('delete');
    const record = mergeSuggestionId ? null : createSuggestionRecord('delete');
    if (!mergeSuggestionId && !record) return false;
    const suggestionId = mergeSuggestionId ?? record!.id;
    const shouldCreateThread = !mergeSuggestionId;

    let didCreateThread = false;
    let updatedSuggestionText: string | null = null;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      let rangeSelection = getDeleteRangeSelection(selection, isBackward);
      if (selection.isCollapsed() && isBackward) {
        const selectionMarkNode = getMarkNodeForSuggestionFromSelection(
          selection,
          suggestionId,
          'delete',
        );
        if (selectionMarkNode && isSelectionAtStartOfMark(selection, selectionMarkNode)) {
          const firstText = getFirstTextDescendant(selectionMarkNode);
          if (firstText) {
            const previous = getPreviousTextNode(firstText);
            if (previous) {
              const previousSize = previous.getTextContentSize();
              const fallbackRange = $createRangeSelection();
              fallbackRange.setTextNodeRange(
                previous,
                Math.max(previousSize - 1, 0),
                previous,
                previousSize,
              );
              rangeSelection = fallbackRange;
            }
          }
        }
      }
      if (!rangeSelection) return;
      $setSelection(rangeSelection);
      selectedText = rangeSelection.getTextContent();
      if (!selectedText) return;
      if (record) {
        suggestionStore.addSuggestion(record);
      }
      applySuggestionMark(rangeSelection, suggestionId, 'delete');
      const markNode =
        getParentMarkNode(rangeSelection.anchor.getNode()) ??
        getMarkNodeForSuggestionFromSelection(rangeSelection, suggestionId, 'delete');
      let selectionMarkNode = markNode;
      if (markNode) {
        const mergedMarkNode = mergeAdjacentMarkNodes(markNode);
        updatedSuggestionText = mergedMarkNode.getTextContent();
        selectionMarkNode = mergedMarkNode;
      }
      if (shouldCreateThread && !didCreateThread) {
        const threadRange = selectionMarkNode
          ? getRangeSelectionForMarkNode(selectionMarkNode) ?? rangeSelection
          : rangeSelection;
        $setSelection(threadRange);
        createSuggestionThreadForSelection(
          editor,
          threadRange,
          {
            threadId: suggestionId,
            initialContent: 'Suggested deletion',
            quote: selectedText,
            isSuggestion: true,
          },
          updatedSuggestionText ?? selectedText,
        );
        didCreateThread = true;
      }
      if (selectionMarkNode) {
        if (isBackward) {
          moveSelectionBeforeNode(selectionMarkNode);
        } else {
          moveSelectionToEndOfMarkNode(selectionMarkNode);
        }
      } else {
        collapseSelectionToEdge(isBackward ? 'start' : 'end');
      }
    });

    if (!shouldCreateThread) {
      queueMicrotask(() => {
        const nextSuggestionText =
          updatedSuggestionText ??
          editor.getEditorState().read(() =>
            getSuggestionTextFromEditorState(suggestionId, 'delete'),
          );
        updateSuggestionThread(editor, suggestionId, nextSuggestionText);
      });
    }
    return true;
  }, [clientId, createSuggestionRecord, currentUser, editor, getMergeableSuggestionId, suggestMode, suggestionStore]);

  const resolveSuggestion = useCallback((suggestionId: string, action: 'accept' | 'reject') => {
    const suggestion = suggestionStore.getSuggestion(suggestionId);
    if (!suggestion) return false;
    if (action === 'accept' && !canAccept) return false;
    if (action === 'reject' && !canReject(suggestionId)) return false;

    const markNodeKeys = markNodeMap.get(suggestionId);
    if (!markNodeKeys || markNodeKeys.size === 0) return false;

    editor.update(() => {
      $addUpdateTag(HISTORY_MERGE_TAG);
      suggestionStore.updateSuggestion(suggestionId, {
        state: action === 'accept' ? 'accepted' : 'rejected',
        updatedAt: Date.now(),
      });
      for (const key of markNodeKeys) {
        const node: null | MarkNode = $getNodeByKey(key);
        if (!$isMarkNode(node)) continue;
        const ids = node.getIDs();
        const suggestionMarks = ids
          .map((id) => parseSuggestionMarkId(id))
          .filter((parsed): parsed is { id: string; kind: SuggestionMarkKind } => !!parsed)
          .filter((parsed) => parsed.id === suggestionId);

        if (suggestionMarks.length === 0) continue;

        for (const mark of suggestionMarks) {
          if (suggestion.type === 'insert') {
            if (action === 'reject' && mark.kind === 'insert') {
              node.remove();
              break;
            }
            node.deleteID(toSuggestionMarkId(suggestionId, mark.kind));
          } else if (suggestion.type === 'delete') {
            if (action === 'accept' && mark.kind === 'delete') {
              node.remove();
              break;
            }
            node.deleteID(toSuggestionMarkId(suggestionId, mark.kind));
          } else if (suggestion.type === 'replace') {
            if (action === 'accept' && mark.kind === 'delete') {
              node.remove();
              break;
            }
            if (action === 'reject' && mark.kind === 'insert') {
              node.remove();
              break;
            }
            node.deleteID(toSuggestionMarkId(suggestionId, mark.kind));
          } else {
            node.deleteID(toSuggestionMarkId(suggestionId, mark.kind));
          }
        }

        // Always unanchor the suggestion thread mark on resolve.
        node.deleteID(suggestionId);
        if ($isMarkNode(node) && node.getIDs().length === 0) {
          $unwrapMarkNode(node);
        }
      }
    }, { tag: HISTORY_MERGE_TAG });

    return true;
  }, [canAccept, canReject, editor, markNodeMap, suggestionStore]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<boolean>(
        TOGGLE_SUGGESTION_MODE_COMMAND,
        (payload) => {
          setSuggestMode(payload);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        (event) => {
          if (event.defaultPrevented) return false;
          if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) {
            return false;
          }
          if (event.key === 'Backspace') {
            const handled = handleDelete(true);
            if (handled) {
              event.preventDefault();
              return true;
            }
            return false;
          }
          if (event.key === 'Delete') {
            const handled = handleDelete(false);
            if (handled) {
              event.preventDefault();
              return true;
            }
            return false;
          }
          if (event.key.length === 1) {
            const handled = handleInsertText(event.key);
            if (handled) {
              event.preventDefault();
              return true;
            }
            return false;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<void>(
        DELETE_CHARACTER_COMMAND,
        () => handleDelete(true),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<void>(
        DELETE_WORD_COMMAND,
        () => handleDelete(true),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<void>(
        DELETE_LINE_COMMAND,
        () => handleDelete(true),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<ClipboardEvent>(
        PASTE_COMMAND,
        (event) => {
          const text = event.clipboardData?.getData('text/plain');
          if (!text) return false;
          event.preventDefault();
          return handleInsertText(text);
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          const hasFiles = !!event.dataTransfer?.files?.length;
          if (hasFiles) return false;
          const text = event.dataTransfer?.getData('text/plain');
          if (!text) return false;
          event.preventDefault();
          return handleInsertText(text);
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<void>(
        KEY_BACKSPACE_COMMAND,
        () => handleDelete(true),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<void>(
        KEY_DELETE_COMMAND,
        () => handleDelete(false),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        RESOLVE_SUGGESTION_BY_ID_COMMAND,
        (payload) => resolveSuggestion(payload.suggestionId, payload.action),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          setActiveSuggestionId(null);
          setActionAnchorRect(null);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, handleDelete, handleInsertText, resolveSuggestion]);

  useEffect(() => {
    const markNodeKeysToIds: Map<string, Array<string>> = new Map();
    return mergeRegister(
      editor.registerNodeTransform(MarkNode, (node) => {
        mergeAdjacentMarkNodes(node);
      }),
      editor.registerMutationListener(MarkNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            const node: null | MarkNode = $getNodeByKey(key);
            let ids: Array<string> = [];
            if (mutation === 'destroyed') {
              ids = markNodeKeysToIds.get(key) || [];
            } else if ($isMarkNode(node)) {
              ids = node.getIDs();
            }

            const previousIds = markNodeKeysToIds.get(key) || [];
            if (mutation !== 'destroyed') {
              const previousSuggestionIds = previousIds
                .map((id) => parseSuggestionMarkId(id))
                .filter((parsed): parsed is { id: string; kind: SuggestionMarkKind } => !!parsed)
                .map((parsed) => parsed.id);
              const currentSuggestionIds = ids
                .map((id) => parseSuggestionMarkId(id))
                .filter((parsed): parsed is { id: string; kind: SuggestionMarkKind } => !!parsed)
                .map((parsed) => parsed.id);
              for (const suggestionId of previousSuggestionIds) {
                if (!currentSuggestionIds.includes(suggestionId)) {
                  const keys = markNodeMap.get(suggestionId);
                  if (keys) {
                    keys.delete(key);
                    if (keys.size === 0) {
                      markNodeMap.delete(suggestionId);
                    }
                  }
                }
              }
            }

            const suggestionId = getSuggestionIdFromMarkIDs(ids);
            if (!suggestionId) continue;
            markNodeKeysToIds.set(key, ids);
            let markNodeKeys = markNodeMap.get(suggestionId);

            if (mutation === 'destroyed') {
              if (markNodeKeys) {
                markNodeKeys.delete(key);
                if (markNodeKeys.size === 0) {
                  markNodeMap.delete(suggestionId);
                }
              }
            } else {
              if (!markNodeKeys) {
                markNodeKeys = new Set();
                markNodeMap.set(suggestionId, markNodeKeys);
              }
              markNodeKeys.add(key);
            }

            const elem = editor.getElementByKey(key);
            if (!elem) continue;
            const suggestionKinds = ids
              .map((id) => parseSuggestionMarkId(id))
              .filter((parsed): parsed is { id: string; kind: SuggestionMarkKind } => !!parsed)
              .filter((parsed) => parsed.id === suggestionId)
              .map((parsed) => parsed.kind);
            if (suggestionKinds.length === 0) {
              delete elem.dataset.suggestionId;
              elem.classList.remove('lexical-suggestion-insert');
              elem.classList.remove('lexical-suggestion-delete');
            } else {
              elem.dataset.suggestionId = suggestionId;
              elem.classList.toggle('lexical-suggestion-insert', suggestionKinds.includes('insert'));
              elem.classList.toggle('lexical-suggestion-delete', suggestionKinds.includes('delete'));
            }
          }
        });
      }, { skipInitialization: false }),
      editor.registerUpdateListener(({ editorState }) => {
        let normalizedSelection: SelectionSnapshot | null = null;
        const pendingThreadUpdates: Array<{ suggestionId: string; text: string }> = [];
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            setActiveSuggestionId(null);
            setActionAnchorRect(null);
            lastInsertSuggestionIdRef.current = null;
            lastReplaceSuggestionIdRef.current = null;
            lastInsertSelectionRef.current = null;
            return;
          }
          const anchorNode = $getNodeByKey(selection.anchor.key);
          const focusNode = $getNodeByKey(selection.focus.key);
          if ($isTextNode(anchorNode) && $isTextNode(focusNode)) {
            const anchorOffset = Math.min(
              selection.anchor.offset,
              anchorNode.getTextContentSize(),
            );
            const focusOffset = Math.min(
              selection.focus.offset,
              focusNode.getTextContentSize(),
            );
            if (
              anchorOffset !== selection.anchor.offset ||
              focusOffset !== selection.focus.offset
            ) {
              normalizedSelection = {
                anchorKey: anchorNode.getKey(),
                anchorOffset,
                focusKey: focusNode.getKey(),
                focusOffset,
              };
              return;
            }
          }

          const suggestionId = getSelectionSuggestionId();
          setActiveSuggestionId(suggestionId);
          if (suggestionId) {
            const suggestion = suggestionStore.getSuggestion(suggestionId);
            if (suggestion?.type === 'insert') {
              lastInsertSuggestionIdRef.current = suggestionId;
            }
            if (suggestion?.type === 'replace') {
              const markNode = getMarkNodeForSuggestionFromSelection(
                selection,
                suggestionId,
                'insert',
              );
              if (markNode) {
                lastReplaceSuggestionIdRef.current = suggestionId;
              } else {
                lastReplaceSuggestionIdRef.current = null;
              }
            } else {
              lastReplaceSuggestionIdRef.current = null;
            }
          } else {
            lastReplaceSuggestionIdRef.current = null;
          }

          const domSelection = getDOMSelection(editor._window);
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width || rect.height) {
              setActionAnchorRect(rect);
            }
          }

          const suggestions = suggestionStore.getSuggestions();
          suggestions.forEach((suggestion, suggestionId) => {
            if (suggestion.state !== 'open') return;
            let text: string | null = null;
            if (suggestion.type === 'insert') {
              text = getSuggestionTextFromEditorState(suggestionId, 'insert');
            } else if (suggestion.type === 'delete') {
              text = getSuggestionTextFromEditorState(suggestionId, 'delete');
            } else if (suggestion.type === 'replace') {
              text =
                getSuggestionTextFromEditorState(suggestionId, 'insert') ??
                getSuggestionTextFromEditorState(suggestionId, 'delete');
            }
            if (!text) return;
            const lastText = lastThreadTextRef.current.get(suggestionId);
            if (lastText === text) return;
            lastThreadTextRef.current.set(suggestionId, text);
            pendingThreadUpdates.push({ suggestionId, text });
          });
        });
        if (normalizedSelection) {
          editor.update(() => {
            restoreSelectionFromSnapshot(normalizedSelection!);
          });
        }
        if (pendingThreadUpdates.length > 0) {
          pendingThreadUpdates.forEach(({ suggestionId, text }) => {
            updateSuggestionThread(editor, suggestionId, text);
          });
        }
      }),
    );
  }, [editor, markNodeMap, suggestionStore]);

  useEffect(() => {
    const nextDecorated = new Set<string>();
    markNodeMap.forEach((keys, suggestionId) => {
      const suggestion = suggestionStore.getSuggestion(suggestionId);
      if (!suggestion) return;
      keys.forEach((key) => {
        const elem = editor.getElementByKey(key);
        if (!elem) return;
        nextDecorated.add(key);
        elem.dataset.suggestionId = suggestionId;
        elem.dataset.suggestionType = suggestion.type;
        elem.classList.toggle('lexical-suggestion-insert', suggestion.type === 'insert');
        elem.classList.toggle('lexical-suggestion-delete', suggestion.type === 'delete');
      });
    });

    decoratedKeysRef.current.forEach((key) => {
      if (nextDecorated.has(key)) return;
      const elem = editor.getElementByKey(key);
      if (!elem) return;
      delete elem.dataset.suggestionId;
      delete elem.dataset.suggestionType;
      elem.classList.remove('lexical-suggestion-insert');
      elem.classList.remove('lexical-suggestion-delete');
    });
    decoratedKeysRef.current = nextDecorated;
  }, [editor, markNodeMap, suggestionStore, suggestions]);

  const toggleSuggestionMode = useCallback(() => {
    editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, !suggestMode);
  }, [editor, suggestMode]);

  const showActions = activeSuggestionId !== null && actionAnchorRect !== null;
  const activeSuggestion = activeSuggestionId
    ? suggestionStore.getSuggestion(activeSuggestionId)
    : null;
  const actionTop = actionAnchorRect ? actionAnchorRect.top - 40 : 0;
  const actionLeft = actionAnchorRect ? actionAnchorRect.left : 0;

  return (
    <>
      <div className={classes.suggestionToggle}>
        <button
          type="button"
          className={classNames(classes.suggestionToggleButton, {
            [classes.suggestionToggleActive]: suggestMode,
          })}
          onClick={toggleSuggestionMode}
        >
          <span className={classes.suggestionBadge}>
            {suggestMode ? 'Suggesting' : 'Editing'}
          </span>
        </button>
      </div>
      {showActions && activeSuggestion && (
        <div
          className={classes.suggestionActions}
          style={{ top: actionTop, left: actionLeft }}
        >
          <Button
            disabled={!canAccept}
            onClick={() => resolveSuggestion(activeSuggestion.id, 'accept')}
          >
            Accept
          </Button>
          <Button
            disabled={!canReject(activeSuggestion.id)}
            onClick={() => resolveSuggestion(activeSuggestion.id, 'reject')}
          >
            Reject
          </Button>
        </div>
      )}
    </>
  );
}
