"use client";

import {
  $getRoot,
  $isElementNode,
  LexicalNode,
  ElementNode,
  TextNode,
} from 'lexical';
import {
  SuggestionInsertionNode,
  $isSuggestionInsertionNode,
} from './nodes/SuggestionInsertionNode';
import {
  SuggestionDeletionNode,
  $isSuggestionDeletionNode,
} from './nodes/SuggestionDeletionNode';

export type SuggestionType = 'insertion' | 'deletion' | 'replacement';

export interface SuggestionInfo {
  id: string;
  type: SuggestionType;
  authorId: string;
  authorName: string;
  timestamp: number;
  insertionNodes: SuggestionInsertionNode[];
  deletionNodes: SuggestionDeletionNode[];
}

/**
 * Generate a unique suggestion ID
 */
export function generateSuggestionId(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substring(0, 8);
}

/**
 * Find all suggestion nodes in the editor by traversing the tree.
 * Groups nodes by suggestionId and determines the type.
 */
export function $getAllSuggestions(): SuggestionInfo[] {
  const suggestionsMap = new Map<string, {
    insertionNodes: SuggestionInsertionNode[];
    deletionNodes: SuggestionDeletionNode[];
    authorId: string;
    authorName: string;
    timestamp: number;
  }>();

  const root = $getRoot();

  function traverse(node: LexicalNode): void {
    if ($isSuggestionInsertionNode(node)) {
      const id = node.getSuggestionId();
      const existing = suggestionsMap.get(id) || {
        insertionNodes: [],
        deletionNodes: [],
        authorId: node.getAuthorId(),
        authorName: node.getAuthorName(),
        timestamp: node.getTimestamp(),
      };
      existing.insertionNodes.push(node);
      suggestionsMap.set(id, existing);
    } else if ($isSuggestionDeletionNode(node)) {
      const id = node.getSuggestionId();
      const existing = suggestionsMap.get(id) || {
        insertionNodes: [],
        deletionNodes: [],
        authorId: node.getAuthorId(),
        authorName: node.getAuthorName(),
        timestamp: node.getTimestamp(),
      };
      existing.deletionNodes.push(node);
      suggestionsMap.set(id, existing);
    }

    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (const child of children) {
        traverse(child);
      }
    }
  }

  traverse(root);

  const suggestions: SuggestionInfo[] = [];
  for (const [id, data] of suggestionsMap) {
    let type: SuggestionType;
    if (data.insertionNodes.length > 0 && data.deletionNodes.length > 0) {
      type = 'replacement';
    } else if (data.insertionNodes.length > 0) {
      type = 'insertion';
    } else {
      type = 'deletion';
    }

    suggestions.push({
      id,
      type,
      authorId: data.authorId,
      authorName: data.authorName,
      timestamp: data.timestamp,
      insertionNodes: data.insertionNodes,
      deletionNodes: data.deletionNodes,
    });
  }

  // Sort by timestamp (oldest first)
  suggestions.sort((a, b) => a.timestamp - b.timestamp);

  return suggestions;
}

/**
 * Find all nodes for a specific suggestion ID
 */
export function $findSuggestionNodes(
  suggestionId: string
): {
  insertionNodes: SuggestionInsertionNode[];
  deletionNodes: SuggestionDeletionNode[];
} {
  const result = {
    insertionNodes: [] as SuggestionInsertionNode[],
    deletionNodes: [] as SuggestionDeletionNode[],
  };

  const root = $getRoot();

  function traverse(node: LexicalNode): void {
    if ($isSuggestionInsertionNode(node) && node.getSuggestionId() === suggestionId) {
      result.insertionNodes.push(node);
    } else if ($isSuggestionDeletionNode(node) && node.getSuggestionId() === suggestionId) {
      result.deletionNodes.push(node);
    }

    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (const child of children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return result;
}

/**
 * Get the suggestion type for a given ID based on what nodes exist
 */
export function $getSuggestionType(suggestionId: string): SuggestionType | null {
  const { insertionNodes, deletionNodes } = $findSuggestionNodes(suggestionId);

  if (insertionNodes.length === 0 && deletionNodes.length === 0) {
    return null;
  }

  if (insertionNodes.length > 0 && deletionNodes.length > 0) {
    return 'replacement';
  } else if (insertionNodes.length > 0) {
    return 'insertion';
  } else {
    return 'deletion';
  }
}

/**
 * Unwrap a suggestion node, moving its children to its parent.
 * The suggestion wrapper is removed but the content remains.
 */
export function $unwrapSuggestionNode(
  node: SuggestionInsertionNode | SuggestionDeletionNode
): void {
  const children = node.getChildren();

  // Move all children out of the suggestion wrapper
  for (const child of children) {
    node.insertBefore(child);
  }

  // Remove the now-empty wrapper
  node.remove();
}

/**
 * Find the parent suggestion insertion node for a given node, if any.
 * Optionally filter by author ID.
 */
export function $findParentSuggestionInsertion(
  node: LexicalNode,
  authorId?: string
): SuggestionInsertionNode | null {
  let current: LexicalNode | null = node.getParent();
  while (current) {
    if ($isSuggestionInsertionNode(current)) {
      if (authorId === undefined || current.getAuthorId() === authorId) {
        return current;
      }
    }
    current = current.getParent();
  }
  return null;
}

/**
 * Find the parent suggestion deletion node for a given node, if any.
 */
export function $findParentSuggestionDeletion(
  node: LexicalNode
): SuggestionDeletionNode | null {
  let current: LexicalNode | null = node.getParent();
  while (current) {
    if ($isSuggestionDeletionNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}

/**
 * Check if a node is inside any suggestion (insertion or deletion)
 */
export function $isInsideSuggestion(node: LexicalNode): boolean {
  return (
    $findParentSuggestionInsertion(node) !== null ||
    $findParentSuggestionDeletion(node) !== null
  );
}

/**
 * Get a text preview of suggestion content
 */
export function $getSuggestionTextContent(
  suggestionId: string,
  type: 'insertion' | 'deletion'
): string {
  const { insertionNodes, deletionNodes } = $findSuggestionNodes(suggestionId);
  const nodes = type === 'insertion' ? insertionNodes : deletionNodes;

  let text = '';
  for (const node of nodes) {
    text += node.getTextContent();
  }

  // Truncate if too long
  if (text.length > 100) {
    text = text.slice(0, 97) + '...';
  }

  return text;
}
