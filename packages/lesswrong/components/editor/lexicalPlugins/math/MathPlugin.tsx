"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  TextNode,
  $getNodeByKey,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { MathNode, $createMathNode, $isMathNode } from './MathNode';
import MathEditorPanel from './MathEditorPanel';
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

/**
 * Get the DOM rect of the current selection
 */
function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // If the rect has no dimensions (collapsed selection), use the anchor node
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

interface MathEditorState {
  isOpen: boolean;
  isInline: boolean;
  initialEquation: string;
  anchorRect: DOMRect | null;
  editingNodeKey: string | null;
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
    anchorRect: null,
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
    const rect = getSelectionRect();
    setEditorState({
      isOpen: true,
      isInline: inline,
      initialEquation: existingEquation,
      anchorRect: rect,
      editingNodeKey: nodeKey,
    });
  }, []);

  const closeEditor = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      isOpen: false,
      editingNodeKey: null,
    }));
    editor.focus();
  }, [editor]);

  const handleSubmit = useCallback((equation: string) => {
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
        }
      } else {
        // Inserting new node
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const mathNode = $createMathNode(equation, editorState.isInline);
          selection.insertNodes([mathNode]);
        }
      }
    });

    closeEditor();
  }, [editor, editorState.editingNodeKey, editorState.isInline, closeEditor]);

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
      editor.registerNodeTransform(TextNode, (textNode) => {
        const text = textNode.getTextContent();
        
        // Check for complete LaTeX expressions with delimiters
        const extracted = extractDelimiters(text);
        if (extracted) {
          const mathNode = $createMathNode(extracted.equation, !extracted.display);
          textNode.replace(mathNode);
        }
      })
    );
  }, [editor, openEditor]);

  // Register click handler for editing existing math nodes
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if we clicked on a math preview
      const mathPreview = target.closest('.math-preview');
      if (mathPreview) {
        event.preventDefault();
        event.stopPropagation();
        
        // Find the corresponding Lexical node
        editor.getEditorState().read(() => {
          // Get all math nodes and find which one was clicked
          editor.getEditorState()._nodeMap.forEach((node, key) => {
            if ($isMathNode(node)) {
              // Check if this node's DOM element contains the clicked element
              const element = editor.getElementByKey(key);
              if (element && element.contains(target)) {
                const rect = mathPreview.getBoundingClientRect();
                setEditorState({
                  isOpen: true,
                  isInline: !node.isDisplayMode(),
                  initialEquation: node.getEquation(),
                  anchorRect: rect,
                  editingNodeKey: key,
                });
              }
            }
          });
        });
      }
    };

    rootElement.addEventListener('click', handleClick);
    return () => {
      rootElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  return (
    <MathEditorPanel
      isOpen={editorState.isOpen}
      initialEquation={editorState.initialEquation}
      isInline={editorState.isInline}
      anchorRect={editorState.anchorRect}
      onSubmit={handleSubmit}
      onCancel={closeEditor}
    />
  );
}

// Re-export MathNode to ensure consistent class instance across imports
// (prevents HMR issues where different modules get different class instances)
export { MathNode } from './MathNode';
