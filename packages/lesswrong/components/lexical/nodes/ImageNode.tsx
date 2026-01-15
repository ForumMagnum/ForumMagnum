/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  RangeSelection,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import React, { type JSX } from 'react';

import {$insertGeneratedNodes} from '@lexical/clipboard';
import {HashtagNode} from '@lexical/hashtag';
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {LinkNode} from '@lexical/link';
import {
  $applyNodeReplacement,
  $createRangeSelection,
  $extendCaretToRange,
  $getChildCaret,
  $getEditor,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $selectAll,
  $setSelection,
  createEditor,
  DecoratorNode,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  SKIP_DOM_SELECTION_TAG,
  TextNode,
} from 'lexical';


import {EmojiNode} from './EmojiNode';
import {KeywordNode} from './KeywordNode';

const ImageComponent = React.lazy(() => import('./ImageComponent'));

export interface ImagePayload {
  altText: string;
  caption?: LexicalEditor;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  srcset?: string | null;
  width?: number;
  widthPercent?: number | null;
  isCkFigure?: boolean;
  captionsEnabled?: boolean;
}

function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
  return (
    img.parentElement != null &&
    img.parentElement.tagName === 'LI' &&
    img.previousSibling === null &&
    img.getAttribute('aria-roledescription') === 'checkbox'
  );
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  const src = img.getAttribute('src');
  if (!src || src.startsWith('file:///') || isGoogleDocCheckboxImg(img)) {
    return null;
  }
  const {alt: altText, width, height} = img;
  const srcset = img.getAttribute('srcset');
  const node = $createImageNode({altText, height, src, width, srcset});
  return {node};
}

export function $isCaptionEditorEmpty(): boolean {
  // Search the document for any non-element node
  // to determine if it's empty or not
  for (const {origin} of $extendCaretToRange(
    $getChildCaret($getRoot(), 'next'),
  )) {
    if (!$isElementNode(origin)) {
      return false;
    }
  }
  return true;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    srcset?: string | null;
    width?: number;
    widthPercent?: number | null;
    isCkFigure?: boolean;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __showCaption: boolean;
  __caption: LexicalEditor;
  __srcset: string | null;
  __widthPercent: number | null;
  __isCkFigure: boolean;
  // Captions cannot yet be used within editor cells
  __captionsEnabled: boolean;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__srcset,
      node.__widthPercent,
      node.__isCkFigure,
      node.__captionsEnabled,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const {
      altText,
      height,
      width,
      maxWidth,
      src,
      showCaption,
      srcset,
      widthPercent,
      isCkFigure,
    } = serializedNode;
    return $createImageNode({
      altText,
      height,
      maxWidth,
      showCaption,
      src,
      srcset,
      widthPercent,
      isCkFigure,
      width,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
    const node = super.updateFromJSON(serializedNode);
    const {caption} = serializedNode;

    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return node;
  }

  exportDOM(): DOMExportOutput {
    const imgElement = document.createElement('img');
    imgElement.setAttribute('src', this.__src);
    imgElement.setAttribute('alt', this.__altText);
    if (typeof this.__width === 'number') {
      imgElement.setAttribute('width', this.__width.toString());
    }
    if (typeof this.__height === 'number') {
      imgElement.setAttribute('height', this.__height.toString());
    }
    if (this.__srcset) {
      imgElement.setAttribute('srcset', this.__srcset);
    }

    const shouldUseFigure =
      this.__showCaption || this.__isCkFigure || this.__widthPercent !== null;

    let captionHtml: string | null = null;
    if (this.__showCaption && this.__caption) {
      const captionEditor = this.__caption;
      captionHtml = captionEditor.read(() => {
        if ($isCaptionEditorEmpty()) {
          return null;
        }
        // Don't serialize the wrapping paragraph if there is only one
        let selection: null | RangeSelection = null;
        const firstChild = $getRoot().getFirstChild();
        if (
          $isParagraphNode(firstChild) &&
          firstChild.getNextSibling() === null
        ) {
          selection = $createRangeSelection();
          selection.anchor.set(firstChild.getKey(), 0, 'element');
          selection.focus.set(
            firstChild.getKey(),
            firstChild.getChildrenSize(),
            'element',
          );
        }
        return $generateHtmlFromNodes(captionEditor, selection);
      });
    }

    if (shouldUseFigure) {
      const figureElement = document.createElement('figure');
      const classNames = ['image'];
      if (this.__widthPercent !== null) {
        classNames.push('image_resized');
        figureElement.setAttribute('style', `width:${this.__widthPercent}%`);
      }
      figureElement.setAttribute('class', classNames.join(' '));
      figureElement.appendChild(imgElement);
      if (captionHtml) {
        const figcaptionElement = document.createElement('figcaption');
        figcaptionElement.innerHTML = captionHtml;
        figureElement.appendChild(figcaptionElement);
      }
      return {element: figureElement};
    }

    return {element: imgElement};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      figcaption: () => ({
        conversion: () => ({node: null}),
        priority: 0,
      }),
      figure: () => ({
        conversion: (node) => {
          return {
            after: (childNodes) => {
              const imageNodes = childNodes.filter($isImageNode);
              const figcaption = node.querySelector('figcaption');
              const figureElement = node as HTMLElement;
              const figureClassList = figureElement.classList;
              const hasCkImageClass = figureClassList.contains('image');
              const widthPercentMatch = figureElement
                .getAttribute('style')
                ?.match(/width:\s*([0-9.]+)%/i);
              const widthPercent = widthPercentMatch
                ? Number(widthPercentMatch[1])
                : null;

              if (figcaption) {
                for (const imgNode of imageNodes) {
                  imgNode.setShowCaption(true);
                  imgNode.__caption.update(
                    () => {
                      const editor = $getEditor();
                      $insertGeneratedNodes(
                        editor,
                        $generateNodesFromDOM(editor, figcaption),
                        $selectAll(),
                      );
                      $setSelection(null);
                    },
                    {tag: SKIP_DOM_SELECTION_TAG},
                  );
                }
              }
              for (const imgNode of imageNodes) {
                if (hasCkImageClass) {
                  imgNode.setIsCkFigure(true);
                }
                if (widthPercent !== null && !Number.isNaN(widthPercent)) {
                  imgNode.setWidthPercent(widthPercent);
                }
              }
              return imageNodes;
            },
            node: null,
          };
        },
        priority: 0,
      }),
      img: () => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    caption?: LexicalEditor,
    srcset?: string | null,
    widthPercent?: number | null,
    isCkFigure?: boolean,
    captionsEnabled?: boolean,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__showCaption = showCaption || false;
    this.__caption =
      caption ||
      createEditor({
        namespace: 'Playground/ImageNodeCaption',
        nodes: [
          RootNode,
          TextNode,
          LineBreakNode,
          ParagraphNode,
          LinkNode,
          EmojiNode,
          HashtagNode,
          KeywordNode,
        ],
      });
    this.__srcset = srcset ?? null;
    this.__widthPercent = widthPercent ?? null;
    this.__isCkFigure = isCkFigure ?? false;
    this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      srcset: this.__srcset,
      width: this.__width === 'inherit' ? 0 : this.__width,
      widthPercent: this.__widthPercent,
      isCkFigure: this.__isCkFigure,
    };
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
    writable.__widthPercent = null;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setSrcset(srcset: string | null): void {
    const writable = this.getWritable();
    writable.__srcset = srcset;
  }

  setWidthPercent(widthPercent: number | null): void {
    const writable = this.getWritable();
    writable.__widthPercent = widthPercent;
  }

  setIsCkFigure(isCkFigure: boolean): void {
    const writable = this.getWritable();
    writable.__isCkFigure = isCkFigure;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getSrcset(): string | null {
    return this.__srcset;
  }

  getWidthPercent(): number | null {
    return this.__widthPercent;
  }

  getIsCkFigure(): boolean {
    return this.__isCkFigure;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.getKey()}
        showCaption={this.__showCaption}
        caption={this.__caption}
        captionsEnabled={this.__captionsEnabled}
        srcSet={this.__srcset}
        widthPercent={this.__widthPercent}
        resizable={true}
      />
    );
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  captionsEnabled,
  src,
  srcset,
  width,
  widthPercent,
  showCaption,
  caption,
  isCkFigure,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      caption,
      srcset,
      widthPercent,
      isCkFigure,
      captionsEnabled,
      key,
    ),
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
