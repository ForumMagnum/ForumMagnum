"use client";

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $isElementNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  KEY_BACKSPACE_COMMAND,
  createCommand,
  type LexicalCommand,
  type LexicalNode,
  type LexicalEditor,
} from 'lexical';
import { mergeRegister, $insertNodeToNearestRoot } from '@lexical/utils';
import {
  LLMContentBlockNode,
  $createLLMContentBlockNode,
  $isLLMContentBlockNode,
} from './LLMContentBlockNode';
import {
  $createLLMContentBlockHeaderNode,
  $isLLMContentBlockHeaderNode,
} from './LLMContentBlockHeaderNode';
import {
  LLMContentBlockContentNode,
  $createLLMContentBlockContentNode,
  $isLLMContentBlockContentNode,
} from './LLMContentBlockContentNode';
import { useMessages } from '@/components/common/withMessages';

/**
 * The header's React component (rendered by DecoratorNode.decorate()) needs to
 * know whether the editor is in suggestion mode so it can make the model-name
 * input read-only. DecoratorNode.decorate() has no way to receive plugin props,
 * so we share the value via a WeakMap keyed by editor instance — the plugin
 * writes it, the header component reads it.
 */
const editorSuggestionModeMap = new WeakMap<LexicalEditor, boolean>();

export function isEditorInSuggestionMode(editor: LexicalEditor): boolean {
  return editorSuggestionModeMap.get(editor) ?? false;
}

export const INSERT_LLM_CONTENT_BLOCK_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_LLM_CONTENT_BLOCK_COMMAND'
);

/**
 * Walk up from `node` to find the nearest LLMContentBlockContentNode
 * ancestor, if any.
 */
function $findContentNodeAncestor(node: LexicalNode): LLMContentBlockContentNode | null {
  let current = node.getParent();
  while (current) {
    if ($isLLMContentBlockContentNode(current)) {
      return current;
    }
    if ($isElementNode(current)) {
      current = current.getParent();
    } else {
      return null;
    }
  }
  return null;
}

/**
 * Ensure that an LLMContentBlockNode has exactly one header (first child)
 * and one content node (second child). Any other children are moved into
 * the content node.
 */
function $ensureLLMContentBlockStructure(containerNode: LLMContentBlockNode): void {
  const children = containerNode.getChildren();

  let headerNode: LexicalNode | null = null;
  let contentNode: LexicalNode | null = null;
  const otherChildren: LexicalNode[] = [];

  for (const child of children) {
    if ($isLLMContentBlockHeaderNode(child) && !headerNode) {
      headerNode = child;
    } else if ($isLLMContentBlockContentNode(child) && !contentNode) {
      contentNode = child;
    } else {
      otherChildren.push(child);
    }
  }

  // Create missing structural nodes
  if (!headerNode) {
    headerNode = $createLLMContentBlockHeaderNode();
    const firstChild = containerNode.getFirstChild();
    if (firstChild) {
      firstChild.insertBefore(headerNode);
    } else {
      containerNode.append(headerNode);
    }
  }

  if (!contentNode) {
    contentNode = $createLLMContentBlockContentNode();
    headerNode.insertAfter(contentNode);
  }

  // Ensure header is first, content is second
  if (containerNode.getFirstChild() !== headerNode) {
    const firstChild = containerNode.getFirstChild();
    if (firstChild) {
      firstChild.insertBefore(headerNode);
    }
  }
  if (headerNode.getNextSibling() !== contentNode) {
    headerNode.insertAfter(contentNode);
  }

  // Move stray children into the content node
  for (const child of otherChildren) {
    if ($isLLMContentBlockContentNode(contentNode)) {
      contentNode.append(child);
    }
  }

  // Ensure the content node has at least one paragraph
  if ($isLLMContentBlockContentNode(contentNode) && contentNode.getChildrenSize() === 0) {
    contentNode.append($createParagraphNode());
  }
}

interface LLMContentBlockPluginProps {
  isSuggestionMode?: boolean;
}

export default function LLMContentBlockPlugin({ isSuggestionMode }: LLMContentBlockPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const { flash } = useMessages();

  useEffect(() => {
    editorSuggestionModeMap.set(editor, isSuggestionMode ?? false);
  }, [editor, isSuggestionMode]);

  useEffect(() => {
    if (!editor.hasNodes([LLMContentBlockNode, LLMContentBlockContentNode])) {
      throw new Error('LLMContentBlockPlugin: required nodes not registered on editor');
    }

    return mergeRegister(
      // Insert command
      editor.registerCommand(
        INSERT_LLM_CONTENT_BLOCK_COMMAND,
        () => {
          if (isSuggestionMode) {
            flash({
              messageString: 'LLM content blocks cannot be created in suggestion mode',
              type: 'error',
            });
            return true;
          }

          editor.update(() => {
            const containerNode = $createLLMContentBlockNode();
            const headerNode = $createLLMContentBlockHeaderNode();
            const contentNode = $createLLMContentBlockContentNode();
            const paragraph = $createParagraphNode();

            contentNode.append(paragraph);
            containerNode.append(headerNode);
            containerNode.append(contentNode);

            $insertNodeToNearestRoot(containerNode);
            paragraph.selectStart();
          });

          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Enter key: exit the content block when pressing Enter on an
      // empty trailing paragraph inside the content node.
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();

          // Walk up to the nearest paragraph-like block
          let block = anchorNode;
          if (!$isElementNode(block)) {
            const parent = block.getParent();
            if (parent && $isElementNode(parent)) {
              block = parent;
            } else {
              return false;
            }
          }

          // The block's parent should be the content node
          const contentParent = block.getParent();
          if (!$isLLMContentBlockContentNode(contentParent)) {
            return false;
          }

          // Only exit if the paragraph is empty and is the last child
          const isEmpty =
            block.getTextContent().length === 0 &&
            block.getChildrenSize() === 0;
          const isLastChild = block.getNextSibling() === null;

          if (!isEmpty || !isLastChild) {
            return false;
          }

          // If this is the only child, don't exit (keep at least one
          // paragraph inside; the user can press Backspace to unwrap)
          if (block.getPreviousSibling() === null) {
            return false;
          }

          // Move the empty paragraph out after the container
          const containerNode = contentParent.getParent();
          if (!$isLLMContentBlockNode(containerNode)) {
            return false;
          }

          containerNode.insertAfter(block);
          block.selectStart();

          event?.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Backspace: prevent unwrap of the content block in suggestion mode
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          if (!isSuggestionMode) {
            return false;
          }

          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          if (selection.anchor.offset !== 0) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const contentNode = $findContentNodeAncestor(anchorNode);
          if (!contentNode) {
            return false;
          }

          // Check if the cursor is at the very start of the first child
          const firstChild = contentNode.getFirstChild();
          let currentNode: LexicalNode = anchorNode;

          // Walk up to find the direct child of the content node
          while (currentNode.getParent() !== contentNode) {
            const parent = currentNode.getParent();
            if (!parent) return false;
            currentNode = parent;
          }

          if (currentNode === firstChild) {
            event.preventDefault();
            flash({
              messageString: 'LLM content blocks cannot be removed in suggestion mode',
              type: 'error',
            });
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Node transform to ensure proper structure after import / paste
      editor.registerNodeTransform(LLMContentBlockNode, (node) => {
        $ensureLLMContentBlockStructure(node);
      }),
    );
  }, [editor, isSuggestionMode, flash]);

  return null;
}
