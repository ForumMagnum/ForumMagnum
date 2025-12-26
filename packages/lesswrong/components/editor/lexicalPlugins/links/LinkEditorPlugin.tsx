"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_MODIFIER_COMMAND,
  createCommand,
  LexicalCommand,
  $createTextNode,
  RangeSelection,
  $isTextNode,
} from 'lexical';
import {
  $isLinkNode,
  $createLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import LinkEditorPanel, { LinkEditorMode } from './LinkEditorPanel';

// Command to open the link editor
export const OPEN_LINK_EDITOR_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_LINK_EDITOR_COMMAND'
);

/**
 * Get the link node at the current selection, if any
 */
function $getSelectedLinkNode(selection: RangeSelection): LinkNode | null {
  const nodes = selection.getNodes();
  
  // Check if we're inside a link
  for (const node of nodes) {
    const parent = $findMatchingParent(node, $isLinkNode);
    if (parent && $isLinkNode(parent)) {
      return parent;
    }
  }
  
  // Check if selection is collapsed and cursor is in a link
  if (selection.isCollapsed()) {
    const anchor = selection.anchor.getNode();
    const parent = $findMatchingParent(anchor, $isLinkNode);
    if (parent && $isLinkNode(parent)) {
      return parent;
    }
  }
  
  return null;
}

/**
 * Get the selected text content
 */
function $getSelectedText(selection: RangeSelection): string {
  return selection.getTextContent();
}

/**
 * Get the DOM rect for the link node or selection
 */
function getSelectionRect(editor: ReturnType<typeof useLexicalComposerContext>[0]): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // If collapsed, try to get from parent element
  if (rect.width === 0 && rect.height === 0) {
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
      return node.parentElement.getBoundingClientRect();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      return (node as Element).getBoundingClientRect();
    }
  }
  
  return rect;
}

interface LinkEditorState {
  isOpen: boolean;
  mode: LinkEditorMode;
  url: string;
  text: string;
  anchorRect: DOMRect | null;
  isEditingExisting: boolean;
}

/**
 * LinkEditorPlugin provides a UI for creating and editing links.
 * 
 * Features:
 * - Ctrl+K to open link editor
 * - Click on link to show toolbar with Edit/Unlink options
 * - Form for entering URL and optional text
 * - Auto-link URLs (handled by @lexical/react/LexicalAutoLinkPlugin if added)
 */
export function LinkEditorPlugin(): React.ReactElement {
  const [editor] = useLexicalComposerContext();
  const [editorState, setEditorState] = useState<LinkEditorState>({
    isOpen: false,
    mode: 'form',
    url: '',
    text: '',
    anchorRect: null,
    isEditingExisting: false,
  });

  const openEditor = useCallback((mode: LinkEditorMode, url: string = '', text: string = '', isExisting: boolean = false) => {
    const rect = getSelectionRect(editor);
    setEditorState({
      isOpen: true,
      mode,
      url,
      text,
      anchorRect: rect,
      isEditingExisting: isExisting,
    });
  }, [editor]);

  const closeEditor = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      isOpen: false,
    }));
    editor.focus();
  }, [editor]);

  const handleSave = useCallback((url: string, newText?: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        closeEditor();
        return;
      }

      // Ensure URL has protocol (but allow relative URLs and hash links)
      let finalUrl = url.trim();
      const isRelativeUrl = finalUrl.startsWith('/') || finalUrl.startsWith('#') || finalUrl.startsWith('?');
      const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(finalUrl); // matches http:, https:, mailto:, tel:, etc.
      if (finalUrl && !isRelativeUrl && !hasProtocol) {
        finalUrl = 'https://' + finalUrl;
      }

      if (editorState.isEditingExisting) {
        // Editing existing link - find and update it
        const linkNode = $getSelectedLinkNode(selection);
        if (linkNode) {
          linkNode.setURL(finalUrl);
          if (newText && newText !== editorState.text) {
            // Update link text
            const textNode = linkNode.getFirstChild();
            if ($isTextNode(textNode)) {
              textNode.setTextContent(newText);
            }
          }
        }
      } else {
        // Creating new link
        if (selection.isCollapsed()) {
          // No selection - insert link with URL as text
          const linkText = newText || finalUrl;
          const linkNode = $createLinkNode(finalUrl);
          linkNode.append($createTextNode(linkText));
          selection.insertNodes([linkNode]);
        } else {
          // Wrap selection in link
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, finalUrl);
        }
      }
    });

    closeEditor();
  }, [editor, editorState.isEditingExisting, editorState.text, closeEditor]);

  const handleUnlink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    closeEditor();
  }, [editor, closeEditor]);

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleEditClick = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      mode: 'form',
    }));
  }, []);

  // Register Ctrl+K command
  useEffect(() => {
    return mergeRegister(
      // Handle Ctrl+K
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (payload) => {
          const { keyCode, ctrlKey, metaKey } = payload as KeyboardEvent;
          // K key is 75
          if (keyCode === 75 && (ctrlKey || metaKey)) {
            payload.preventDefault();
            
            editor.getEditorState().read(() => {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) return;
              
              const linkNode = $getSelectedLinkNode(selection);
              if (linkNode) {
                // Already in a link - open editor to edit
                openEditor('form', linkNode.getURL(), linkNode.getTextContent(), true);
              } else {
                // Not in a link - open editor to create
                const selectedText = $getSelectedText(selection);
                openEditor('form', '', selectedText, false);
              }
            });
            
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      // Handle OPEN_LINK_EDITOR_COMMAND
      editor.registerCommand(
        OPEN_LINK_EDITOR_COMMAND,
        () => {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            
            const linkNode = $getSelectedLinkNode(selection);
            if (linkNode) {
              openEditor('form', linkNode.getURL(), linkNode.getTextContent(), true);
            } else {
              const selectedText = $getSelectedText(selection);
              openEditor('form', '', selectedText, false);
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, openEditor]);

  // Register click handler for existing links
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if we clicked on a link
      const linkElement = target.closest('a');
      if (linkElement && rootElement.contains(linkElement)) {
        const href = linkElement.getAttribute('href');
        if (!href) return;
        
        // Ctrl+Click (Windows/Linux) or Cmd+Click (Mac) to open link
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isModifierClick = isMac ? event.metaKey : event.ctrlKey;
        
        if (isModifierClick) {
          event.preventDefault();
          event.stopPropagation();
          window.open(href, '_blank', 'noopener,noreferrer');
          return;
        }
        
        event.preventDefault();
        
        const rect = linkElement.getBoundingClientRect();
        const textContent = linkElement.textContent || '';
        
        setEditorState({
          isOpen: true,
          mode: 'toolbar',
          url: href,
          text: textContent,
          anchorRect: rect,
          isEditingExisting: true,
        });
      }
    };

    rootElement.addEventListener('click', handleClick);
    return () => {
      rootElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  return (
    <LinkEditorPanel
      isOpen={editorState.isOpen}
      mode={editorState.mode}
      initialUrl={editorState.url}
      initialText={editorState.text}
      anchorRect={editorState.anchorRect}
      onSave={handleSave}
      onUnlink={handleUnlink}
      onOpenLink={handleOpenLink}
      onEditClick={handleEditClick}
      onCancel={closeEditor}
    />
  );
}

export default LinkEditorPlugin;

