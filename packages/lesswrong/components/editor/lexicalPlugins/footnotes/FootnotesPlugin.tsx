"use client";

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  $isTextNode,
  $isElementNode,
  $createParagraphNode,
  $addUpdateTag,
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
  SELECTION_CHANGE_COMMAND,
  EditorState,
  HISTORY_MERGE_TAG,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

import { generateFootnoteId } from './constants';
import { FootnoteReferenceNode, $createFootnoteReferenceNode, $isFootnoteReferenceNode } from './FootnoteReferenceNode';
import { $createFootnoteSectionNode, $isFootnoteSectionNode } from './FootnoteSectionNode';
import { FootnoteItemNode, $createFootnoteItemNode, $isFootnoteItemNode } from './FootnoteItemNode';
import { $createFootnoteContentNode, $isFootnoteContentNode } from './FootnoteContentNode';
import { $createFootnoteBackLinkNode } from './FootnoteBackLinkNode';

import { $getFootnoteItems, $getNextFootnoteIndex, $getFootnoteSection, $reorderFootnotes, $getSelectedFootnoteItem, $removeFootnote, $isFootnoteEmpty, $getFootnoteReferences, $shouldCheckForFootnoteReorder } from './helpers';
import { insertGoogleDocsFootnotesOnPaste } from './googleDocsFootnoteNormalizer';

export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<{ footnoteIndex?: number }> = createCommand(
  'INSERT_FOOTNOTE_COMMAND'
);

const HISTORY_MERGE = { tag: HISTORY_MERGE_TAG };

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
      $addUpdateTag(HISTORY_MERGE_TAG);
      $reorderFootnotes();
    }, HISTORY_MERGE);
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

function preventBackLinkSelection(editor: LexicalEditor): boolean {
  let didPrevent = false;
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return;
    }
    const anchorNode = selection.anchor.getNode();
    if (!$isFootnoteItemNode(anchorNode)) {
      return;
    }
    if (selection.anchor.offset > 1) {
      return;
    }
    const footnoteContent = anchorNode
      .getChildren()
      .find((child) => $isFootnoteContentNode(child));
    if (!footnoteContent) {
      return;
    }
    const firstChild = footnoteContent.getFirstChild();
    if (firstChild) {
      firstChild.selectStart();
    } else {
      footnoteContent.selectStart();
    }
    didPrevent = true;
  });
  return didPrevent;
}

type FootnoteReferenceDirection = 'before' | 'after';

function getFootnoteReferenceAdjacentToCursor(
  selection: ReturnType<typeof $getSelection>,
  direction: FootnoteReferenceDirection
): FootnoteReferenceNode | null {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }
  const anchorNode = selection.anchor.getNode();
  if ($isFootnoteReferenceNode(anchorNode)) {
    return anchorNode;
  }
  if ($isTextNode(anchorNode)) {
    if (direction === 'before' && selection.anchor.offset === 0) {
      const previousSibling = anchorNode.getPreviousSibling();
      return $isFootnoteReferenceNode(previousSibling) ? previousSibling : null;
    }
    if (
      direction === 'after' &&
      selection.anchor.offset === anchorNode.getTextContentSize()
    ) {
      const nextSibling = anchorNode.getNextSibling();
      return $isFootnoteReferenceNode(nextSibling) ? nextSibling : null;
    }
    return null;
  }
  if ($isElementNode(anchorNode)) {
    const index = direction === 'before'
      ? selection.anchor.offset - 1
      : selection.anchor.offset;
    if (index < 0) {
      return null;
    }
    const sibling = anchorNode.getChildAtIndex(index);
    return $isFootnoteReferenceNode(sibling) ? sibling : null;
  }
  return null;
}

function deleteFootnoteReferenceAdjacentToCursor(
  editor: LexicalEditor,
  event: KeyboardEvent | null,
  direction: FootnoteReferenceDirection
): boolean {
  let didDelete = false;
  editor.update(() => {
    const selection = $getSelection();
    const reference = getFootnoteReferenceAdjacentToCursor(selection, direction);
    if (!reference) {
      return;
    }
    event?.preventDefault();
    reference.remove();
    didDelete = true;
  });
  return didDelete;
}


export function FootnotesPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const lastReferenceOrderRef = useRef<string | null>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
        if (tags.has('collaboration')) {
          return;
        }
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
        (event) => {
          if (deleteFootnoteReferenceAdjacentToCursor(editor, event, 'before')) {
            return true;
          }
          return deleteEmptyFootnoteOnBackspace(editor, event);
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          if (deleteFootnoteReferenceAdjacentToCursor(editor, event, 'after')) {
            return true;
          }
          return deleteFootnoteItemOrSectionOnDelete(editor, event);
        },
        COMMAND_PRIORITY_HIGH
      ),
      
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          return preventBackLinkSelection(editor);
        },
        COMMAND_PRIORITY_LOW
      ),

    );
  }, [editor]);

  return null;
}

