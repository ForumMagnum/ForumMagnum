"use client";

import React, { useEffect, useRef } from 'react';
import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { renderEquation } from './loadMathJax';

export type SerializedMathNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

/**
 * MathNode represents a LaTeX math expression in the document.
 * It supports both inline math (using \( \) delimiters) and display math (using \[ \] delimiters).
 * 
 * The node stores the raw LaTeX equation and renders it using MathJax.
 */
export class MathNode extends DecoratorNode<React.ReactElement> {
  __equation: string;
  __inline: boolean;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline: boolean = true, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  getEquation(): string {
    return this.__equation;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  isInline(): boolean {
    // Always return true for cursor navigation purposes
    // Display math is styled as block but treated as inline by Lexical
    return true;
  }

  isDisplayMode(): boolean {
    return !this.__inline;
  }

  createDOM(): HTMLElement {
    // Always use span for proper cursor navigation
    const element = document.createElement('span');
    element.className = 'math-tex';
    if (!this.__inline) {
      // Style as block but keep as inline element for Lexical
      element.style.display = 'block';
      element.style.textAlign = 'center';
      element.style.margin = '1em 0';
    }
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    // Use span for inline, div for display (for proper HTML output)
    const element = this.__inline ? document.createElement('span') : document.createElement('div');
    element.className = 'math-tex';
    
    // Use the standard delimiters
    if (this.__inline) {
      element.textContent = `\\(${this.__equation}\\)`;
    } else {
      element.textContent = `\\[${this.__equation}\\]`;
      element.style.display = 'block';
      element.style.textAlign = 'center';
      element.style.margin = '1em 0';
    }
    
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('math-tex')) {
          return null;
        }
        return {
          conversion: convertMathElement,
          priority: 2,
        };
      },
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains('math-tex')) {
          return null;
        }
        return {
          conversion: convertMathElement,
          priority: 2,
        };
      },
      // Also handle script tags with math/tex type
      script: (domNode: HTMLElement) => {
        const type = domNode.getAttribute('type');
        if (type !== 'math/tex' && type !== 'math/tex; mode=display') {
          return null;
        }
        return {
          conversion: convertScriptMathElement,
          priority: 2,
        };
      },
    };
  }

  exportJSON(): SerializedMathNode {
    return {
      type: 'math',
      version: 1,
      equation: this.__equation,
      inline: this.__inline,
    };
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    return $createMathNode(serializedNode.equation, serializedNode.inline);
  }

  decorate(): React.ReactElement {
    return (
      <MathComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.__key}
      />
    );
  }
}

/**
 * Extract equation and display mode from math text content
 */
function extractDelimiters(text: string): { equation: string; display: boolean } {
  text = text.trim();
  
  // Check for display delimiters \[ \]
  if (text.startsWith('\\[') && text.endsWith('\\]')) {
    return {
      equation: text.slice(2, -2).trim(),
      display: true,
    };
  }
  
  // Check for inline delimiters \( \)
  if (text.startsWith('\\(') && text.endsWith('\\)')) {
    return {
      equation: text.slice(2, -2).trim(),
      display: false,
    };
  }
  
  // No delimiters, assume inline
  return {
    equation: text,
    display: false,
  };
}

function convertMathElement(domNode: HTMLElement): DOMConversionOutput | null {
  // Check if this is already rendered MathJax (has mjx-* children)
  const mjxElement = domNode.querySelector('.mjx-chtml, .mjx-math, mjx-container');
  if (mjxElement) {
    // Extract equation from aria-label
    const ariaLabel = mjxElement.getAttribute('aria-label') || 
                      mjxElement.querySelector('[aria-label]')?.getAttribute('aria-label');
    if (ariaLabel) {
      const isDisplay = domNode.classList.contains('MJXc-display') || 
                        domNode.tagName === 'DIV';
      return { node: $createMathNode(ariaLabel, !isDisplay) };
    }
  }
  
  // Get the raw text content
  const textContent = domNode.textContent || '';
  const { equation, display } = extractDelimiters(textContent);
  
  if (!equation) {
    return null;
  }
  
  return { node: $createMathNode(equation, !display) };
}

function convertScriptMathElement(domNode: HTMLElement): DOMConversionOutput | null {
  const type = domNode.getAttribute('type');
  const equation = domNode.textContent?.trim() || '';
  
  if (!equation) {
    return null;
  }
  
  const isDisplay = type === 'math/tex; mode=display';
  return { node: $createMathNode(equation, !isDisplay) };
}

export function $createMathNode(equation: string, inline: boolean = true): MathNode {
  return new MathNode(equation, inline);
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}

// React component for rendering math
interface MathComponentProps {
  equation: string;
  inline: boolean;
  nodeKey: string;
}

function MathComponent({ equation, inline }: MathComponentProps): React.ReactElement {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Show loading state
    containerRef.current.textContent = '...';
    
    // Render the equation (this will load MathJax if needed)
    void renderEquation(equation, containerRef.current, !inline);
  }, [equation, inline]);

  const style: React.CSSProperties = inline
    ? { display: 'inline-block', userSelect: 'none' }
    : { display: 'block', textAlign: 'center', margin: '1em 0', userSelect: 'none' };

  return (
    <span
      ref={containerRef}
      className={`math-preview ${inline ? 'math-inline' : 'math-display'}`}
      style={style}
    >
      {/* Initial content shows loading indicator while MathJax loads */}
      ...
    </span>
  );
}

