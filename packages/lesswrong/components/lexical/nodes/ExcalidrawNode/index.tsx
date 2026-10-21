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

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import type {JSX} from 'react';

import {DecoratorNode} from 'lexical';
import * as React from 'react';
import {
  EXCALIDRAW_DIAGRAM_CLASS,
  EXCALIDRAW_DIAGRAM_RESIZED_CLASS,
  EXCALIDRAW_SCENE_ATTRIBUTE,
} from '@/lib/lexical/excalidrawDiagrams';

const ExcalidrawComponent = React.lazy(() => import('./ExcalidrawComponent'));

export type SerializedExcalidrawNode = Spread<
  {
    data: string;
    svg: string;
    widthPercent?: number | null;
  },
  SerializedLexicalNode
>;

function parseWidthPercent(domNode: HTMLElement): number | null {
  const match = /^([\d.]+)%$/.exec(domNode.style.width);
  if (!match) {
    return null;
  }
  const widthPercent = parseFloat(match[1]);
  return Number.isFinite(widthPercent) ? widthPercent : null;
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
  const node = $createExcalidrawNode(
    excalidrawData ?? '[]',
    svg?.outerHTML ?? '',
    parseWidthPercent(domNode),
  );
  return {
    node,
    // The SVG's contents (eg its <text> elements) are part of this node, not
    // separate Lexical nodes.
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
    const div = document.createElement('div');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
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
    // This is user-provided markup, but the exported HTML is sanitized
    // server-side before it's shown to anyone, so we don't sanitize it here.
    element.innerHTML = this.__svg;
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

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <ExcalidrawComponent
        nodeKey={this.getKey()}
        data={this.__data}
        svg={this.__svg}
        widthPercent={this.__widthPercent}
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
