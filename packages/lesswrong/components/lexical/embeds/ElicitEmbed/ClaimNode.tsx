"use client";

import React from 'react';
import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  EditorConfig,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
} from 'lexical';
import ElicitBlock from '@/components/contents/ElicitBlock';

export interface SerializedClaimNode extends SerializedLexicalNode {
  claimId: string;
}

interface ClaimComponentProps {
  claimId: string;
}

/**
 * Component to render claim preview in the editor using ElicitBlock directly
 */
function ClaimComponent({ claimId }: ClaimComponentProps): React.ReactElement {
  return (
    <div 
      className="elicit-binary-prediction-editor-preview"
      style={{ margin: '8px 0' }}
    >
      <ElicitBlock questionId={claimId} />
    </div>
  );
}

/**
 * Lexical node for embedded claims/predictions.
 * Renders as <div class="elicit-binary-prediction" data-elicit-id="..."> in HTML.
 */
export class ClaimNode extends DecoratorNode<React.ReactElement> {
  __claimId: string;

  static getType(): string {
    return 'claim';
  }

  static clone(node: ClaimNode): ClaimNode {
    return new ClaimNode(node.__claimId, node.__key);
  }

  constructor(claimId: string, key?: NodeKey) {
    super(key);
    this.__claimId = claimId;
  }

  getClaimId(): string {
    return this.__claimId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'elicit-binary-prediction-wrapper';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node: HTMLElement) => {
        if (node.classList.contains('elicit-binary-prediction')) {
          return {
            conversion: convertClaimElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'elicit-binary-prediction';
    element.setAttribute('data-elicit-id', this.__claimId);
    element.textContent = 'Prediction';
    return { element };
  }

  static importJSON(serializedNode: SerializedClaimNode): ClaimNode {
    return $createClaimNode(serializedNode.claimId);
  }

  exportJSON(): SerializedClaimNode {
    return {
      type: 'claim',
      version: 1,
      claimId: this.__claimId,
    };
  }

  decorate(): React.ReactElement {
    return <ClaimComponent claimId={this.__claimId} />;
  }

  isInline(): boolean {
    return false;
  }
}

function convertClaimElement(element: HTMLElement): DOMConversionOutput {
  const claimId = element.getAttribute('data-elicit-id') || '';
  return { node: $createClaimNode(claimId) };
}

export function $createClaimNode(claimId: string): ClaimNode {
  return new ClaimNode(claimId);
}

export function $isClaimNode(node: LexicalNode | null | undefined): node is ClaimNode {
  return node instanceof ClaimNode;
}
