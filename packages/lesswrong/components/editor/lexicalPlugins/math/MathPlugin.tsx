"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $onUpdate,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  TextNode,
  $getNodeByKey,
  $getNearestNodeFromDOMNode,
  $createParagraphNode,
  $isRootNode,
  RootNode,
  $isTextNode,
  $getRoot,
} from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import { MathNode, $createMathNode, $isMathNode } from './MathNode';
import MathEditorPanel from './MathEditorPanel';
import type { VirtualElement } from '@floating-ui/react';
import { $getMathEditorAnchor } from './mathEditorAnchor';
import { loadMathJax } from './loadMathJax';

// Commands for opening the math editor panel
export const OPEN_MATH_EDITOR_COMMAND: LexicalCommand<{ inline: boolean }> = createCommand(
  'OPEN_MATH_EDITOR_COMMAND'
);

// Legacy commands that insert math directly (useful for programmatic insertion)
export const INSERT_MATH_COMMAND: LexicalCommand<{ equation?: string; inline?: boolean }> = createCommand(
  'INSERT_MATH_COMMAND'
);

export const INSERT_INLINE_MATH_COMMAND: LexicalCommand<{ equation?: string }> = createCommand(
  'INSERT_INLINE_MATH_COMMAND'
);

export const INSERT_DISPLAY_MATH_COMMAND: LexicalCommand<{ equation?: string }> = createCommand(
  'INSERT_DISPLAY_MATH_COMMAND'
);

/**
 * Extract equation and determine if it's display mode
 */
function extractDelimiters(text: string): { equation: string; display: boolean } | null {
  text = text.trim();
  
  // Check for display delimiters \[ \]
  const displayMatch = text.match(/^\\\[([\s\S]*?)\\\]$/);
  if (displayMatch) {
    return {
      equation: displayMatch[1].trim(),
      display: true,
    };
  }
  
  // Check for inline delimiters \( \)
  const inlineMatch = text.match(/^\\\(([\s\S]*?)\\\)$/);
  if (inlineMatch) {
    return {
      equation: inlineMatch[1].trim(),
      display: false,
    };
  }
  
  return null;
}

interface MathEditorState {
  isOpen: boolean;
  isInline: boolean;
  initialEquation: string;
  anchor: VirtualElement | null;
  editingNodeKey: string | null;
}

function shouldAutoConvertMath(textNode: TextNode): boolean {
  if (textNode.isTextEntity?.()) {
    return false;
  }
  let parent = textNode.getParent();
  while (parent) {
    if ($isCodeNode(parent) || $isLinkNode(parent)) {
      return false;
    }
    parent = parent.getParent();
  }
  return true;
}

function ensureTrailingParagraphAfterMath(rootNode: RootNode) {
  const lastChild = rootNode.getLastChild();
  if (!$isMathNode(lastChild)) {
    return;
  }
  const paragraph = $createParagraphNode();
  rootNode.append(paragraph);

  const selection = $getSelection();
  if (selection && $isRangeSelection(selection)) {
    const anchorNode = selection.anchor.getNode();
    if ($isRootNode(anchorNode)) {
      paragraph.selectEnd();
    }
  }
}

/**
 * MathPlugin provides LaTeX math equation support for the Lexical editor.
 * 
 * Features:
 * - Insert inline math via toolbar button (opens floating editor)
 * - Insert display math via toolbar button (opens floating editor)
 * - Click on existing math to edit
 * - Auto-converts pasted LaTeX with \( \) or \[ \] delimiters
 * - Renders equations using MathJax
 * - Live preview while editing
 * 
 * Equations are stored as raw LaTeX and rendered in the editor using MathJax.
 * The HTML output uses standard math-tex class with appropriate delimiters.
 */
export function MathPlugin(): React.ReactElement {
  const [editor] = useLexicalComposerContext();
  const [editorState, setEditorState] = useState<MathEditorState>({
    isOpen: false,
    isInline: true,
    initialEquation: '',
    anchor: null,
    editingNodeKey: null,
  });

  useEffect(() => {
    // Check if MathNode is registered
    if (!editor.hasNodes([MathNode])) {
      throw new Error('MathPlugin: MathNode is not registered on the editor');
    }
    
    // Pre-load MathJax so it's ready when needed
    void loadMathJax();
  }, [editor]);

  const openEditor = useCallback((inline: boolean, existingEquation: string = '', nodeKey: string | null = null) => {
    // Slash-menu commands run before their text is removed from the DOM. Read
    // Lexical's selection after reconciliation, rather than the browser's
    // selection, which may have moved into the menu when an option was clicked.
    $onUpdate(() => {
      const anchor = editor.getEditorState().read(() => $getMathEditorAnchor(editor));
      setEditorState({
        isOpen: true,
        isInline: inline,
        initialEquation: existingEquation,
        anchor,
        editingNodeKey: nodeKey,
      });
    });
  }, [editor]);

  const closeEditor = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      isOpen: false,
      editingNodeKey: null,
    }));
    editor.focus();
  }, [editor]);

  const handleSubmit = useCallback((equation: string, inline: boolean) => {
    if (!equation.trim()) {
      closeEditor();
      return;
    }

    editor.update(() => {
      if (editorState.editingNodeKey) {
        // Editing existing node
        const node = $getNodeByKey(editorState.editingNodeKey);
        if ($isMathNode(node)) {
          node.setEquation(equation);
          node.setInline(inline);
        }
      } else {
        // Inserting new node
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const mathNode = $createMathNode(equation, inline);
          selection.insertNodes([mathNode]);
          if (!inline) {
            const rootNode = mathNode.getParent();
            if (rootNode && $isRootNode(rootNode) && !mathNode.getNextSibling()) {
              const paragraph = $createParagraphNode();
              rootNode.append(paragraph);
              paragraph.selectEnd();
            }
          }
        }
      }
    });

    closeEditor();
  }, [editor, editorState.editingNodeKey, closeEditor]);

  useEffect(() => {
    return mergeRegister(
      // Handle OPEN_MATH_EDITOR_COMMAND
      editor.registerCommand(
        OPEN_MATH_EDITOR_COMMAND,
        (payload) => {
          openEditor(payload.inline);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),

      // Handle INSERT_MATH_COMMAND (for programmatic insertion)
      editor.registerCommand(
        INSERT_MATH_COMMAND,
        (payload) => {
          const { equation = '', inline = true } = payload;
          
          if (equation) {
            // Direct insert
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const mathNode = $createMathNode(equation, inline);
                selection.insertNodes([mathNode]);
              }
            });
          } else {
            // Open editor
            openEditor(inline);
          }
          
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      
      // Handle INSERT_INLINE_MATH_COMMAND
      editor.registerCommand(
        INSERT_INLINE_MATH_COMMAND,
        (payload) => {
          if (payload?.equation) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const mathNode = $createMathNode(payload.equation!, true);
                selection.insertNodes([mathNode]);
              }
            });
          } else {
            openEditor(true);
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      
      // Handle INSERT_DISPLAY_MATH_COMMAND
      editor.registerCommand(
        INSERT_DISPLAY_MATH_COMMAND,
        (payload) => {
          if (payload?.equation) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const mathNode = $createMathNode(payload.equation!, false);
                selection.insertNodes([mathNode]);
              }
            });
          } else {
            openEditor(false);
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      
      // Register text node transform to auto-convert LaTeX delimiters
      editor.registerUpdateListener(({dirtyLeaves, dirtyElements, tags}) => {
        if (tags.has('collaboration')) {
          return;
        }
        editor.update(() => {
          for (const key of dirtyLeaves) {
            const textNode = $getNodeByKey(key);
            if ($isTextNode(textNode)) {
              const text = textNode.getTextContent();
              
              // Check for complete LaTeX expressions with delimiters
              const extracted = extractDelimiters(text);
              if (!extracted || !shouldAutoConvertMath(textNode)) {
                continue;
              }
              const mathNode = $createMathNode(extracted.equation, !extracted.display);
              textNode.replace(mathNode);
            }
          }
          
          // Check root node for trailing paragraph
          // We check if any dirty element is the root or a child of root
          // But simpler to just check root every time there's a local update
          const rootNode = $getRoot();
          ensureTrailingParagraphAfterMath(rootNode);
        });
      })
    );
  }, [editor, openEditor]);

  // Register click handler for editing existing math nodes.
  // Uses registerRootListener so the handler is properly re-attached if the
  // root element changes (e.g. when ContentEditable remounts).
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if we clicked on a math preview
      const mathPreview = target.closest('.math-preview');
      if (mathPreview) {
        event.preventDefault();
        event.stopPropagation();
        
        editor.update(() => {
          const node = $getNearestNodeFromDOMNode(target);
          if ($isMathNode(node)) {
            // Move the insertion point next to the clicked equation, so that
            // when the panel closes and the editor regains focus, the user
            // stays at the equation instead of being scrolled back to
            // wherever their insertion point was before clicking.
            node.selectNext(0, 0);
            setEditorState({
              isOpen: true,
              isInline: !node.isDisplayMode(),
              initialEquation: node.getEquation(),
              anchor: mathPreview,
              editingNodeKey: node.getKey(),
            });
          }
        });
      }
    };

    // Use the capture phase so this handler fires before any ancestor React
    // onClick handlers that call stopPropagation (e.g. CommentFrame's expand
    // handler), which would otherwise prevent the click from reaching a
    // bubble-phase listener on the root element.
    return editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('click', handleClick, true);
      rootElement?.addEventListener('click', handleClick, true);
    });
  }, [editor]);

  return (
    <MathEditorPanel
      isOpen={editorState.isOpen}
      initialEquation={editorState.initialEquation}
      isInline={editorState.isInline}
      anchor={editorState.anchor}
      onSubmit={handleSubmit}
      onCancel={closeEditor}
    />
  );
}

