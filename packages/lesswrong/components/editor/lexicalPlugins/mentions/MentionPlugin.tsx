"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  TextNode,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isTextNode,
  RangeSelection,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import MentionDropdown, { MentionItem } from './MentionDropdown';

/**
 * Configuration for a mention feed
 */
export interface MentionFeed {
  /** The marker character that triggers this feed (e.g., '@', '#') */
  marker: string;
  /** 
   * Feed data - can be:
   * - A static array of items
   * - A function that returns items (sync or async)
   */
  feed: MentionItem[] | ((query: string) => MentionItem[] | Promise<MentionItem[]>);
  /** Minimum characters after marker before showing suggestions (default: 0) */
  minimumCharacters?: number;
  /** Custom item renderer */
  itemRenderer?: (item: MentionItem) => React.ReactNode;
}

export interface MentionPluginProps {
  /** List of mention feeds to support */
  feeds: MentionFeed[];
  /** Maximum number of items to show in dropdown (default: 10) */
  dropdownLimit?: number;
  /** Keys that commit a selection (default: Enter, Tab) */
  commitKeys?: ('Enter' | 'Tab')[];
}

interface MentionState {
  isOpen: boolean;
  items: MentionItem[];
  selectedIndex: number;
  anchorRect: DOMRect | null;
  loading: boolean;
  marker: string;
  query: string;
  matchStart: number;
  currentFeed: MentionFeed | null;
}

/**
 * Creates a regex pattern for detecting mention markers
 */
function createMentionPattern(marker: string, minChars: number): RegExp {
  // Match marker followed by word characters (0-20 chars after minChars requirement)
  const charPattern = minChars > 0 ? `\\S{${minChars},20}` : `\\S{0,20}`;
  // Match at start of text or after whitespace/punctuation
  return new RegExp(`(?:^|[\\s([{])${escapeRegex(marker)}(${charPattern})$`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the text content before the cursor in the current block
 */
function getTextBeforeCursor(selection: RangeSelection): string | null {
  const anchor = selection.anchor;
  const anchorNode = anchor.getNode();
  
  if (!$isTextNode(anchorNode)) {
    return null;
  }
  
  const textContent = anchorNode.getTextContent();
  return textContent.slice(0, anchor.offset);
}

/**
 * Get cursor position in the DOM
 */
function getCursorRect(): DOMRect | null {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }
  
  const range = domSelection.getRangeAt(0);
  const rects = range.getClientRects();
  
  if (rects.length > 0) {
    return rects[0];
  }
  
  // Fallback for collapsed selection
  const container = range.startContainer;
  if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
    return container.parentElement.getBoundingClientRect();
  }
  
  return null;
}

/**
 * MentionPlugin provides @ mention functionality similar to CKEditor's mention plugin.
 * 
 * Features:
 * - Multiple mention types (e.g., @ for users, # for tags)
 * - Async feed support for searching
 * - Keyboard navigation
 * - Custom item renderers
 */
export function MentionPlugin({
  feeds,
  dropdownLimit = 10,
  commitKeys = ['Enter', 'Tab'],
}: MentionPluginProps): React.ReactElement {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<MentionState>({
    isOpen: false,
    items: [],
    selectedIndex: 0,
    anchorRect: null,
    loading: false,
    marker: '',
    query: '',
    matchStart: 0,
    currentFeed: null,
  });
  
  // Track the last request to handle race conditions
  const lastRequestRef = useRef<string>('');
  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const closeDropdown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      items: [],
      selectedIndex: 0,
      loading: false,
    }));
  }, []);

  const fetchFeed = useCallback(async (feed: MentionFeed, query: string, marker: string) => {
    const requestId = `${marker}:${query}`;
    lastRequestRef.current = requestId;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      let items: MentionItem[];
      
      if (typeof feed.feed === 'function') {
        const result = feed.feed(query);
        items = result instanceof Promise ? await result : result;
      } else {
        // Static array - filter by query
        items = feed.feed.filter(item => {
          const searchText = (item.label || item.id).toLowerCase();
          return searchText.includes(query.toLowerCase());
        });
      }
      
      // Check if this is still the current request
      if (lastRequestRef.current !== requestId) {
        return; // Discard stale response
      }
      
      // Limit items
      const limitedItems = items.slice(0, dropdownLimit);
      
      setState(prev => ({
        ...prev,
        items: limitedItems,
        loading: false,
        selectedIndex: 0,
      }));
    } catch {
      // Feed request failed - close dropdown
      if (lastRequestRef.current === requestId) {
        closeDropdown();
      }
    }
  }, [dropdownLimit, closeDropdown]);

  const checkForMention = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        closeDropdown();
        return;
      }
      
      const textBefore = getTextBeforeCursor(selection);
      if (textBefore === null) {
        closeDropdown();
        return;
      }
      
      // Check each feed's marker
      for (const feed of feeds) {
        const pattern = createMentionPattern(feed.marker, feed.minimumCharacters || 0);
        const match = textBefore.match(pattern);
        
        if (match) {
          const query = match[1] || '';
          const markerIndex = textBefore.lastIndexOf(feed.marker);
          
          // Get cursor position for dropdown
          const rect = getCursorRect();
          
          setState(prev => ({
            ...prev,
            isOpen: true,
            marker: feed.marker,
            query,
            matchStart: markerIndex,
            anchorRect: rect,
            currentFeed: feed,
          }));
          
          // Debounce the feed request
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            void fetchFeed(feed, query, feed.marker);
          }, 100);
          
          return;
        }
      }
      
      // No match found
      closeDropdown();
    });
  }, [editor, feeds, fetchFeed, closeDropdown]);

  const insertMention = useCallback((item: MentionItem) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      
      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();
      
      if (!$isTextNode(anchorNode)) {
        return;
      }
      
      // Calculate what to replace
      const textContent = anchorNode.getTextContent();
      const beforeMatch = textContent.slice(0, state.matchStart);
      const afterCursor = textContent.slice(anchor.offset);
      
      // Create the mention link
      const mentionText = item.text || item.id;
      const linkNode = $createLinkNode(item.link);
      linkNode.append($createTextNode(mentionText));
      
      // Replace the text node content
      if (beforeMatch) {
        const beforeNode = $createTextNode(beforeMatch);
        anchorNode.insertBefore(beforeNode);
      }
      
      anchorNode.insertBefore(linkNode);
      
      // Add a space after the mention
      const spaceNode = $createTextNode(' ');
      anchorNode.insertBefore(spaceNode);
      
      // Update the original node with remaining text or remove it
      if (afterCursor) {
        anchorNode.setTextContent(afterCursor);
      } else {
        anchorNode.remove();
      }
      
      // Move selection after the space
      spaceNode.selectEnd();
    });
    
    closeDropdown();
  }, [editor, state.matchStart, closeDropdown]);

  // Listen for text changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      // Only check on user input, not programmatic changes
      if (tags.has('history-merge') || tags.has('collaboration')) {
        return;
      }
      checkForMention();
    });
  }, [editor, checkForMention]);

  // Register keyboard commands
  useEffect(() => {
    if (!state.isOpen) return;

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (!state.isOpen || state.items.length === 0) return false;
          event.preventDefault();
          setState(prev => ({
            ...prev,
            selectedIndex: (prev.selectedIndex + 1) % prev.items.length,
          }));
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (!state.isOpen || state.items.length === 0) return false;
          event.preventDefault();
          setState(prev => ({
            ...prev,
            selectedIndex: prev.selectedIndex <= 0 
              ? prev.items.length - 1 
              : prev.selectedIndex - 1,
          }));
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (!state.isOpen || state.items.length === 0) return false;
          if (!commitKeys.includes('Enter')) return false;
          event?.preventDefault();
          const selectedItem = state.items[state.selectedIndex];
          if (selectedItem) {
            insertMention(selectedItem);
          }
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (!state.isOpen || state.items.length === 0) return false;
          if (!commitKeys.includes('Tab')) return false;
          event?.preventDefault();
          const selectedItem = state.items[state.selectedIndex];
          if (selectedItem) {
            insertMention(selectedItem);
          }
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!state.isOpen) return false;
          closeDropdown();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, state.isOpen, state.items, state.selectedIndex, commitKeys, insertMention, closeDropdown]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <MentionDropdown
      isOpen={state.isOpen}
      items={state.items}
      selectedIndex={state.selectedIndex}
      anchorRect={state.anchorRect}
      loading={state.loading}
      onSelect={insertMention}
      onClose={closeDropdown}
      renderItem={state.currentFeed?.itemRenderer}
    />
  );
}

export default MentionPlugin;

