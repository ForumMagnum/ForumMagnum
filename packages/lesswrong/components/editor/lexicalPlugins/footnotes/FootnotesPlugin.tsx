"use client";

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  $isTextNode,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  LexicalEditor,
  LexicalCommand,
  LexicalNode,
  PASTE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  EditorState,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

import { generateFootnoteId } from './constants';
import { FootnoteReferenceNode, $createFootnoteReferenceNode } from './FootnoteReferenceNode';
import { $createFootnoteSectionNode, $isFootnoteSectionNode } from './FootnoteSectionNode';
import { FootnoteItemNode, $createFootnoteItemNode, $isFootnoteItemNode } from './FootnoteItemNode';
import { $createFootnoteContentNode } from './FootnoteContentNode';
import { $createFootnoteBackLinkNode } from './FootnoteBackLinkNode';

import { $getFootnoteItems, $getNextFootnoteIndex, $getFootnoteSection, $reorderFootnotes, $getSelectedFootnoteItem, $removeFootnote, $isFootnoteEmpty, $getFootnoteReferences, $shouldCheckForFootnoteReorder } from './helpers';
import { insertGoogleDocsFootnotesOnPaste } from './googleDocsFootnoteNormalizer';

export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<{ footnoteIndex?: number }> = createCommand(
  'INSERT_FOOTNOTE_COMMAND'
);

function reorderFootnotesWhenReferenceOrderChanges(
  editor: LexicalEditor,
  lastReferenceOrderRef: { current: string | null },
  dirtyElements: Map<string, boolean>,
  dirtyLeaves: Set<string>,
  editorState: EditorState
): void {
  editorState.read(() => {
    if (!dirtyElements.size && !dirtyLeaves.size) {
      return;
    }
    if (!$shouldCheckForFootnoteReorder(dirtyElements, dirtyLeaves)) {
      return;
    }
    const references = $getFootnoteReferences();
    const referenceOrder = references.map((ref) => ref.getFootnoteId()).join('|');
    if (referenceOrder === lastReferenceOrderRef.current) {
      return;
    }
    lastReferenceOrderRef.current = referenceOrder;
    if (!referenceOrder) {
      return;
    }
    editor.update(() => {
      $reorderFootnotes();
    });
  });
}

function insertFootnoteReferenceAtSelection(
  editor: LexicalEditor,
  payload: { footnoteIndex?: number }
): boolean {
  const { footnoteIndex } = payload;

  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }

    let id: string;
    let index: number;

    if (footnoteIndex && footnoteIndex > 0) {
      const items = $getFootnoteItems();
      const existingItem = items.find(
        (item) => item.getFootnoteIndex() === footnoteIndex
      );

      if (existingItem) {
        id = existingItem.getFootnoteId();
        index = footnoteIndex;
      } else {
        // Invalid index, do nothing
        return false;
      }
    } else {
      id = generateFootnoteId();
      index = $getNextFootnoteIndex();

      // Create the footnote section if it doesn't exist
      let section = $getFootnoteSection();
      if (!section) {
        section = $createFootnoteSectionNode();
        const root = $getRoot();
        root.append(section);
      }

      // Create the footnote item
      const footnoteItem = $createFootnoteItemNode(id, index);
      const footnoteBackLink = $createFootnoteBackLinkNode(id);
      const footnoteContent = $createFootnoteContentNode();
      const paragraph = $createParagraphNode();

      footnoteContent.append(paragraph);
      footnoteItem.append(footnoteBackLink);
      footnoteItem.append(footnoteContent);
      section.append(footnoteItem);
    }

    if (!selection.isCollapsed()) {
      const endPoint = selection.isBackward()
        ? selection.anchor
        : selection.focus;
      const endNode = endPoint.getNode();
      if ($isTextNode(endNode)) {
        selection.setTextNodeRange(
          endNode,
          endPoint.offset,
          endNode,
          endPoint.offset,
        );
      }
    }

    // Insert the reference at the current cursor position
    const footnoteReference = $createFootnoteReferenceNode(id, index);
    selection.insertNodes([footnoteReference]);

    // Reorder footnotes if needed
    $reorderFootnotes();
  });

  return true;
}

function deleteEmptyFootnoteOnBackspace(
  editor: LexicalEditor,
  event: KeyboardEvent | null
): boolean {
  const selection = $getSelection();
  if ($isNodeSelection(selection)) {
    const footnoteItem = $getSelectedFootnoteItem();
    if (footnoteItem) {
      event?.preventDefault();
      editor.update(() => {
        $removeFootnote(footnoteItem);
      });
      return true;
    }
    return false;
  }
  if (!$isRangeSelection(selection)) {
    return false;
  }

  // Check if we're in a footnote
  const anchorNode = selection.anchor.getNode();
  let footnoteItem: FootnoteItemNode | null = null;

  let parent: LexicalNode | null = anchorNode;
  while (parent) {
    if ($isFootnoteItemNode(parent)) {
      footnoteItem = parent;
      break;
    }
    parent = parent.getParent();
  }

  if (!footnoteItem) {
    return false;
  }

  // Check if the footnote is empty
  if ($isFootnoteEmpty(footnoteItem)) {
    event?.preventDefault();
    editor.update(() => {
      $removeFootnote(footnoteItem);
    });
    return true;
  }

  return false;
}

function deleteFootnoteItemOrSectionOnDelete(
  editor: LexicalEditor,
  event: KeyboardEvent | null
): boolean {
  const selection = $getSelection();
  if ($isNodeSelection(selection)) {
    const footnoteItem = $getSelectedFootnoteItem();
    if (footnoteItem) {
      event?.preventDefault();
      editor.update(() => {
        $removeFootnote(footnoteItem);
      });
      return true;
    }
  }
  if (!$isRangeSelection(selection)) {
    return false;
  }

  // Check if footnote section is selected
  const nodes = selection.getNodes();
  for (const node of nodes) {
    if ($isFootnoteSectionNode(node)) {
      editor.update(() => {
        // Remove all references when section is deleted
        const references = $getFootnoteReferences();
        for (const ref of references) {
          ref.remove();
        }
        node.remove();
      });
      return true;
    }
  }

  return false;
}

function reorderFootnotesAfterReferenceMutations(
  editor: LexicalEditor,
  mutations: Map<string, 'created' | 'destroyed' | 'updated'>
): void {
  let shouldReorder = false;
  for (const mutation of mutations.values()) {
    if (mutation === 'created' || mutation === 'destroyed') {
      shouldReorder = true;
      break;
    }
  }
  if (shouldReorder) {
    editor.update(() => {
      $reorderFootnotes();
    });
  }
}


export function FootnotesPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const lastReferenceOrderRef = useRef<string | null>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        reorderFootnotesWhenReferenceOrderChanges(
          editor,
          lastReferenceOrderRef,
          dirtyElements,
          dirtyLeaves,
          editorState
        );
      }),

      editor.registerCommand(
        PASTE_COMMAND,
        (event) => insertGoogleDocsFootnotesOnPaste(editor, event),
        COMMAND_PRIORITY_HIGH
      ),

      editor.registerCommand(
        INSERT_FOOTNOTE_COMMAND,
        (payload) => insertFootnoteReferenceAtSelection(editor, payload),
        COMMAND_PRIORITY_EDITOR
      ),
      
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => deleteEmptyFootnoteOnBackspace(editor, event),
        COMMAND_PRIORITY_LOW
      ),
      
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => deleteFootnoteItemOrSectionOnDelete(editor, event),
        COMMAND_PRIORITY_LOW
      ),

      editor.registerMutationListener(FootnoteReferenceNode, (mutations) => {
        reorderFootnotesAfterReferenceMutations(editor, mutations);
      })
    );
  }, [editor]);

  return null;
}

