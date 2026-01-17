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
  BaseSelection,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import React, { type JSX } from 'react';

import {$generateNodesFromDOM} from '@lexical/html';
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $extendCaretToRange,
  $getChildCaret,
  $getEditor,
  $isElementNode,
  $setSelection,
  DecoratorNode,
  ElementNode,
} from 'lexical';


const ImageComponent = React.lazy(() => import('./ImageComponent'));

export interface ImagePayload {
  altText: string;
  height?: number;
  key?: NodeKey;
  html?: string | null;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  srcset?: string | null;
  width?: number;
  widthPercent?: number | null;
  isCkFigure?: boolean;
  captionsEnabled?: boolean;
}

type LegacySerializedImageNode = {
  showCaption?: boolean;
};

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number;
    maxWidth: number;
    src: string;
    srcset?: string | null;
    width?: number;
    widthPercent?: number | null;
    isCkFigure?: boolean;
    captionsEnabled?: boolean;
  } & LegacySerializedImageNode,
  SerializedElementNode
>;

export type SerializedImageRenderNode = SerializedLexicalNode;

export type SerializedImageCaptionNode = SerializedElementNode;

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

export function $isCaptionNodeEmpty(node: ImageCaptionNode): boolean {
  return node.getTextContent().trim().length === 0;
}

export class ImageCaptionNode extends ElementNode {
  static getType(): string {
    return 'image-caption';
  }

  static clone(node: ImageCaptionNode): ImageCaptionNode {
    return new ImageCaptionNode(node.__key);
  }

  static importJSON(serializedNode: SerializedImageCaptionNode): ImageCaptionNode {
    return $createImageCaptionNode().updateFromJSON(serializedNode);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('figcaption');
    dom.className = 'image-caption-container';
    dom.setAttribute('data-placeholder', 'Enter image caption');
    dom.setAttribute('data-empty', 'true');
    dom.setAttribute('contenteditable', 'true');
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.isEmpty() !== this.isEmpty()) {
      dom.setAttribute('data-empty', this.isEmpty() ? 'true' : 'false');
    }
    return false;
  }

  isEmpty(): boolean {
    return $isCaptionNodeEmpty(this);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('figcaption');
    element.className = 'image-caption-container';
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      figcaption: (domNode: HTMLElement) => {
        if (domNode.parentElement?.tagName === 'FIGURE') {
          return null;
        }
        return {
          conversion: () => ({node: $createImageCaptionNode()}),
          priority: 1,
        };
      },
    };
  }

  canBeEmpty(): boolean {
    return true;
  }

  collapseAtStart(): boolean {
    const parent = this.getParent();
    if ($isImageNode(parent)) {
      parent.remove();
      return true;
    }
    return false;
  }
}

export function $createImageCaptionNode(): ImageCaptionNode {
  return new ImageCaptionNode();
}

export function $isImageCaptionNode(
  node: LexicalNode | null | undefined,
): node is ImageCaptionNode {
  return node instanceof ImageCaptionNode;
}

export class ImageRenderNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'image-render';
  }

  static clone(node: ImageRenderNode): ImageRenderNode {
    return new ImageRenderNode(node.__key);
  }

  static importJSON(
    _serializedNode: SerializedImageRenderNode,
  ): ImageRenderNode {
    return $createImageRenderNode();
  }

  exportJSON(): SerializedImageRenderNode {
    return {
      ...super.exportJSON(),
      type: ImageRenderNode.getType(),
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    return {element: null};
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'contents';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    const parent = this.getParent();
    if (!$isImageNode(parent)) {
      return <></>;
    }

    return (
      <ImageComponent
        src={parent.getSrc()}
        altText={parent.getAltText()}
        width={parent.getWidth()}
        height={parent.getHeight()}
        maxWidth={parent.getMaxWidth()}
        imageNodeKey={parent.getKey()}
        showCaption={parent.getShowCaption()}
        captionsEnabled={parent.getCaptionsEnabled()}
        srcSet={parent.getSrcset()}
        widthPercent={parent.getWidthPercent()}
        resizable={true}
      />
    );
  }
}

export function $createImageRenderNode(): ImageRenderNode {
  return new ImageRenderNode();
}

export function $isImageRenderNode(
  node: LexicalNode | null | undefined,
): node is ImageRenderNode {
  return node instanceof ImageRenderNode;
}

export class ImageNode extends ElementNode {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __showCaption: boolean;
  __srcset: string | null;
  __widthPercent: number | null;
  __isCkFigure: boolean;
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
      captionsEnabled,
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
      captionsEnabled,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
    const node = super.updateFromJSON(serializedNode);
    node.ensureRenderNode();

    if (serializedNode.showCaption) {
      const captionNode = node.ensureCaptionNode();
      if (captionNode.getChildrenSize() === 0) {
        captionNode.append($createParagraphNode());
      }
      node.__showCaption = true;
    }

    return node;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
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

    if (!this.shouldUseFigure()) {
      return {element: imgElement};
    }

    const figureElement = document.createElement('figure');
    const classNames = ['image'];
    if (this.__widthPercent !== null) {
      classNames.push('image_resized');
      figureElement.setAttribute('style', `width:${this.__widthPercent}%`);
    }
    figureElement.setAttribute('class', classNames.join(' '));
    figureElement.appendChild(imgElement);

    const figcaptionElement = buildCaptionElement(editor, this.getCaptionNode());
    if (figcaptionElement) {
      figureElement.appendChild(figcaptionElement);
    }

    return {element: figureElement};
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
                  const captionNode = imgNode.ensureCaptionNode();
                  const editor = $getEditor();
                  const generatedNodes = $generateNodesFromDOM(editor, figcaption);
                  captionNode.append(...generatedNodes);
                  imgNode.setShowCaption(true);
                  $setSelection(null);
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
    this.__srcset = srcset ?? null;
    this.__widthPercent = widthPercent ?? null;
    this.__isCkFigure = isCkFigure ?? false;
    this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      srcset: this.__srcset,
      width: this.__width === 'inherit' ? 0 : this.__width,
      widthPercent: this.__widthPercent,
      isCkFigure: this.__isCkFigure,
      captionsEnabled: this.__captionsEnabled,
      showCaption: this.getShowCaption(),
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const figure = document.createElement('figure');
    const className = config.theme.image;
    if (className !== undefined) {
      figure.className = className;
    }
    figure.setAttribute('contenteditable', 'false');
    return figure;
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

  getWidth(): 'inherit' | number {
    return this.__width;
  }

  getHeight(): 'inherit' | number {
    return this.__height;
  }

  getMaxWidth(): number {
    return this.__maxWidth;
  }

  getCaptionsEnabled(): boolean {
    return this.__captionsEnabled;
  }

  getShowCaption(): boolean {
    return this.__showCaption && this.getCaptionNode() !== null;
  }

  shouldUseFigure(): boolean {
    return this.__showCaption || this.__isCkFigure || this.__widthPercent !== null;
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
    if (showCaption) {
      const captionNode = writable.ensureCaptionNode();
      if (captionNode.getChildrenSize() === 0) {
        captionNode.append($createParagraphNode());
      }
    } else {
      const captionNode = writable.getCaptionNode();
      if (captionNode) {
        captionNode.remove();
      }
    }
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

  ensureRenderNode(): ImageRenderNode {
    const firstChild = this.getFirstChild();
    if (firstChild && $isImageRenderNode(firstChild)) {
      return firstChild;
    }
    const renderNode = $createImageRenderNode();
    if (firstChild) {
      firstChild.insertBefore(renderNode);
    } else {
      this.append(renderNode);
    }
    return renderNode;
  }

  ensureCaptionNode(): ImageCaptionNode {
    const existing = this.getCaptionNode();
    if (existing) {
      return existing;
    }
    const captionNode = $createImageCaptionNode();
    this.append(captionNode);
    return captionNode;
  }

  getCaptionNode(): ImageCaptionNode | null {
    for (const child of this.getChildren()) {
      if ($isImageCaptionNode(child)) {
        return child;
      }
    }
    return null;
  }

  canIndent(): false {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  extractWithChild(
    _child: LexicalNode,
    _selection: BaseSelection | null,
    _destination: 'clone' | 'html',
  ): boolean {
    return false;
  }
}

function buildCaptionElement(
  editor: LexicalEditor,
  captionNode: ImageCaptionNode | null,
): HTMLElement | null {
  if (!captionNode || captionNode.isEmpty()) {
    return null;
  }
  const figcaptionElement = document.createElement('figcaption');
  figcaptionElement.className = 'image-caption-container';
  const fragment = document.createDocumentFragment();
  for (const child of captionNode.getChildren()) {
    const exportOutput = child.exportDOM(editor) as DOMExportOutput;
    const childElement = exportOutput.element;
    if (!childElement) {
      continue;
    }
    const appended = exportOutput.after ? exportOutput.after(childElement) : childElement;
    if (appended) {
      fragment.appendChild(appended);
    }
  }
  figcaptionElement.appendChild(fragment);
  return figcaptionElement;
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
  isCkFigure,
  key,
}: ImagePayload): ImageNode {
  const imageNode = new ImageNode(
    src,
    altText,
    maxWidth,
    width,
    height,
    showCaption,
    srcset,
    widthPercent,
    isCkFigure,
    captionsEnabled,
    key,
  );
  imageNode.ensureRenderNode();
  if (showCaption) {
    imageNode.ensureCaptionNode();
  }
  return $applyNodeReplacement(imageNode);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
