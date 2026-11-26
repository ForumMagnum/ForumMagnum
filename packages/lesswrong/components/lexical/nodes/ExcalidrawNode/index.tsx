// Vendored from: https://github.com/facebook/lexical/commit/2e0f8fa65f7c9a389603008671d120bbd1f71d7a
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// LessWrong modifications from upstream:
//  * The node is block-level, and exports to a <figure> (see
//    @/lib/lexical/excalidrawDiagrams) rather than an inline <span>.
//  * The node stores a rendered SVG (generated when the diagram is saved)
//    alongside the scene data, so that it can be exported to HTML without the
//    Excalidraw library loaded, from headless editors, and without the node
//    having been rendered into the DOM.
//  * Resizing is by percent-of-editor-width (like ImageNode) rather than by
//    pixel width and height.
//  * A diagram can have a caption; see CaptionedExcalidrawNode.

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import type {JSX} from 'react';

import {$generateNodesFromDOM} from '@lexical/html';
import {$wrapNodeInElement} from '@lexical/utils';
import {
  $createParagraphNode,
  $getEditor,
  DecoratorNode,
  ElementNode,
  isHTMLElement,
} from 'lexical';
import * as React from 'react';
import {
  EXCALIDRAW_DIAGRAM_CLASS,
  EXCALIDRAW_DIAGRAM_RESIZED_CLASS,
  EXCALIDRAW_SCENE_ATTRIBUTE,
} from '@/lib/lexical/excalidrawDiagrams';
import { sanitize } from '@/lib/utils/sanitize';
import {
  $createImageCaptionNode,
  $isCaptionNodeEmpty,
  $isImageCaptionNode,
  type ImageCaptionNode,
} from '../ImageNode';

const ExcalidrawComponent = React.lazy(() => import('./ExcalidrawComponent'));

export type SerializedExcalidrawNode = Spread<
  {
    data: string;
    svg: string;
    widthPercent?: number | null;
  },
  SerializedLexicalNode
>;

export type SerializedCaptionedExcalidrawNode = SerializedElementNode;

function parseWidthPercent(domNode: HTMLElement): number | null {
  const match = /^([\d.]+)%$/.exec(domNode.style.width);
  if (!match) {
    return null;
  }
  const widthPercent = parseFloat(match[1]);
  return Number.isFinite(widthPercent) ? widthPercent : null;
}

function $convertExcalidrawCaption(domNode: HTMLElement): ImageCaptionNode | null {
  const figcaption = domNode.querySelector('figcaption');
  if (!figcaption) {
    return null;
  }
  const captionNode = $createImageCaptionNode().append(
    ...$generateNodesFromDOM($getEditor(), figcaption),
  );
  return $isCaptionNodeEmpty(captionNode) ? null : captionNode;
}

function $convertExcalidrawElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const excalidrawData = domNode.getAttribute(EXCALIDRAW_SCENE_ATTRIBUTE);
  const svg = domNode.querySelector('svg');
  if (!excalidrawData && !svg) {
    return null;
  }
  // If the scene data is missing (eg because this HTML went through the
  // sanitizer), we still keep the rendered SVG; the diagram just isn't
  // editable.
  const diagramNode = $createExcalidrawNode(
    excalidrawData ?? '[]',
    svg?.outerHTML ?? '',
    parseWidthPercent(domNode),
  );
  const captionNode = $convertExcalidrawCaption(domNode);
  return {
    node: captionNode
      ? $createCaptionedExcalidrawNode().append(diagramNode, captionNode)
      : diagramNode,
    // The SVG's contents (eg its <text> elements) are part of the diagram
    // node, not separate Lexical nodes, and the caption is converted above.
    forChild: () => null,
  };
}

export class ExcalidrawNode extends DecoratorNode<JSX.Element> {
  __data: string;
  __svg: string;
  __widthPercent: number | null;

  static getType(): string {
    return 'excalidraw';
  }

  static clone(node: ExcalidrawNode): ExcalidrawNode {
    return new ExcalidrawNode(
      node.__data,
      node.__svg,
      node.__widthPercent,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedExcalidrawNode): ExcalidrawNode {
    return new ExcalidrawNode(
      serializedNode.data,
      serializedNode.svg,
      serializedNode.widthPercent ?? null,
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedExcalidrawNode {
    return {
      ...super.exportJSON(),
      data: this.__data,
      svg: this.__svg,
      widthPercent: this.__widthPercent,
    };
  }

  constructor(
    data = '[]',
    svg = '',
    widthPercent: number | null = null,
    key?: NodeKey,
  ) {
    super(key);
    this.__data = data;
    this.__svg = svg;
    this.__widthPercent = widthPercent;
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    // ExcalidrawComponent sets the diagram's width on the nearest <figure>,
    // which is this element unless a CaptionedExcalidrawNode provides one
    // that also contains the caption.
    const element = document.createElement(this.hasCaption() ? 'div' : 'figure');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      element.className = className;
    }
    return element;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): false {
    return false;
  }

  static importDOM(): DOMConversionMap<HTMLElement> | null {
    return {
      figure: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(EXCALIDRAW_DIAGRAM_CLASS)) {
          return null;
        }
        return {
          conversion: $convertExcalidrawElement,
          // Higher priority than ImageNode's handling of <figure>
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('figure');
    element.classList.add(EXCALIDRAW_DIAGRAM_CLASS);
    if (this.__widthPercent !== null) {
      element.classList.add(EXCALIDRAW_DIAGRAM_RESIZED_CLASS);
      element.style.width = `${this.__widthPercent}%`;
    }
    element.setAttribute(EXCALIDRAW_SCENE_ATTRIBUTE, this.__data);
    // This is user-provided markup. It must be sanitized even though exported
    // HTML is also sanitized server-side, because the editor exports in the
    // browser (eg on every change), and assigning innerHTML runs event
    // handlers in the markup even on an element that isn't in the page.
    element.innerHTML = sanitize(this.__svg);
    return {element};
  }

  getData(): string {
    return this.getLatest().__data;
  }

  setData(data: string): this {
    const self = this.getWritable();
    self.__data = data;
    return self;
  }

  getSvg(): string {
    return this.getLatest().__svg;
  }

  setSvg(svg: string): this {
    const self = this.getWritable();
    self.__svg = svg;
    return self;
  }

  getWidthPercent(): number | null {
    return this.getLatest().__widthPercent;
  }

  setWidthPercent(widthPercent: number | null): this {
    const self = this.getWritable();
    self.__widthPercent = widthPercent;
    return self;
  }

  hasCaption(): boolean {
    return $isCaptionedExcalidrawNode(this.getParent());
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <ExcalidrawComponent
        nodeKey={this.getKey()}
        data={this.__data}
        svg={this.__svg}
        widthPercent={this.__widthPercent}
        hasCaption={this.hasCaption()}
      />
    );
  }
}

export function $createExcalidrawNode(
  data: string = '[]',
  svg: string = '',
  widthPercent: number | null = null,
): ExcalidrawNode {
  return new ExcalidrawNode(data, svg, widthPercent);
}

export function $isExcalidrawNode(
  node: LexicalNode | null | undefined,
): node is ExcalidrawNode {
  return node instanceof ExcalidrawNode;
}

function isExcalidrawFigureElement(element: Element): element is HTMLElement {
  return (
    isHTMLElement(element) &&
    element.tagName === 'FIGURE' &&
    element.classList.contains(EXCALIDRAW_DIAGRAM_CLASS)
  );
}

/**
 * A diagram with a caption: an ExcalidrawNode followed by an ImageCaptionNode
 * (the same node that holds the captions of images). This node only exists
 * while the diagram has a caption; a diagram without one is an ExcalidrawNode
 * on its own.
 *
 * The caption isn't part of ExcalidrawNode because that's a decorator node,
 * which can't have children, and it can't be turned into an element node
 * without making the collaborative (Yjs) documents that already contain
 * diagrams unloadable, since the two kinds of node are stored differently.
 */
export class CaptionedExcalidrawNode extends ElementNode {
  static getType(): string {
    return 'captioned-excalidraw';
  }

  static clone(node: CaptionedExcalidrawNode): CaptionedExcalidrawNode {
    return new CaptionedExcalidrawNode(node.__key);
  }

  static importJSON(
    serializedNode: SerializedCaptionedExcalidrawNode,
  ): CaptionedExcalidrawNode {
    return $createCaptionedExcalidrawNode().updateFromJSON(serializedNode);
  }

  createDOM(): HTMLElement {
    const figure = document.createElement('figure');
    figure.setAttribute('contenteditable', 'false');
    return figure;
  }

  updateDOM(): false {
    return false;
  }

  // Importing is handled by ExcalidrawNode, since whether the result is one
  // of these depends on whether the diagram has a caption.
  static importDOM(): null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    return {
      element: document.createElement('div'),
      // The children are exported into the element above: the diagram as a
      // <figure>, and the caption as a <figcaption>, which belongs inside of
      // that <figure>.
      after: (container) => {
        const exportedChildren = isHTMLElement(container) ? Array.from(container.children) : [];
        const figure = exportedChildren.find(isExcalidrawFigureElement);
        figure?.append(...exportedChildren.filter((child) => child !== figure));
        return figure;
      },
    };
  }

  getDiagramNode(): ExcalidrawNode | null {
    return this.getChildren().find($isExcalidrawNode) ?? null;
  }

  getCaptionNode(): ImageCaptionNode | null {
    return this.getChildren().find($isImageCaptionNode) ?? null;
  }

  isShadowRoot(): true {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }

  canIndent(): false {
    return false;
  }
}

export function $createCaptionedExcalidrawNode(): CaptionedExcalidrawNode {
  return new CaptionedExcalidrawNode();
}

export function $isCaptionedExcalidrawNode(
  node: LexicalNode | null | undefined,
): node is CaptionedExcalidrawNode {
  return node instanceof CaptionedExcalidrawNode;
}

/** Gives a diagram that doesn't have a caption an empty one. */
export function $addExcalidrawCaption(diagramNode: ExcalidrawNode): ImageCaptionNode {
  const captionNode = $createImageCaptionNode().append($createParagraphNode());
  $wrapNodeInElement(diagramNode, $createCaptionedExcalidrawNode).append(captionNode);
  return captionNode;
}
