import {
  $createParagraphNode,
  $isInlineElementOrDecoratorNode,
  $isLineBreakNode,
  $isTextNode,
  ElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';
import { FOOTNOTE_ATTRIBUTES, FOOTNOTE_CLASSES } from './constants';
import { $createFootnoteContentNode, $isFootnoteContentNode, FootnoteContentNode } from './FootnoteContentNode';
import { $createFootnoteBackLinkNode, $isFootnoteBackLinkNode } from './FootnoteBackLinkNode';

export type SerializedFootnoteItemNode = Spread<
  {
    footnoteId: string;
    footnoteIndex: number;
  },
  SerializedElementNode
>;

/**
 * FootnoteItemNode represents an individual footnote in the footnote section.
 * It contains a back-link and editable content.
 */
export class FootnoteItemNode extends ElementNode {
  __footnoteId: string;
  __footnoteIndex: number;

  static getType(): string {
    return 'footnote-item';
  }

  static clone(node: FootnoteItemNode): FootnoteItemNode {
    return new FootnoteItemNode(
      node.__footnoteId,
      node.__footnoteIndex,
      node.__key
    );
  }

  constructor(footnoteId: string, footnoteIndex: number, key?: NodeKey) {
    super(key);
    this.__footnoteId = footnoteId;
    this.__footnoteIndex = footnoteIndex;
  }

  getFootnoteId(): string {
    return this.__footnoteId;
  }

  getFootnoteIndex(): number {
    return this.__footnoteIndex;
  }

  setFootnoteIndex(index: number): void {
    const writable = this.getWritable();
    writable.__footnoteIndex = index;
  }

  createDOM(): HTMLElement {
    const li = document.createElement('li');
    li.className = FOOTNOTE_CLASSES.footnoteItem;
    li.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteItem, '');
    li.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
    li.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
    li.setAttribute('role', 'doc-endnote');
    li.id = `fn${this.__footnoteId}`;
    return li;
  }

  updateDOM(prevNode: FootnoteItemNode, dom: HTMLElement): boolean {
    if (prevNode.__footnoteIndex !== this.__footnoteIndex) {
      dom.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const li = document.createElement('li');
    li.className = FOOTNOTE_CLASSES.footnoteItem;
    li.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteItem, '');
    li.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, this.__footnoteId);
    li.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(this.__footnoteIndex));
    li.setAttribute('role', 'doc-endnote');
    li.id = `fn${this.__footnoteId}`;
    return { element: li };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      li: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteItem)) {
          return null;
        }
        return {
          conversion: convertFootnoteItemElement,
          priority: 2,
        };
      },
    };
  }

  exportJSON(): SerializedFootnoteItemNode {
    return {
      ...super.exportJSON(),
      type: 'footnote-item',
      version: 1,
      footnoteId: this.__footnoteId,
      footnoteIndex: this.__footnoteIndex,
    };
  }

  static importJSON(serializedNode: SerializedFootnoteItemNode): FootnoteItemNode {
    return $createFootnoteItemNode(
      serializedNode.footnoteId,
      serializedNode.footnoteIndex
    );
  }

  isShadowRoot(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }
}

function convertFootnoteItemElement(domNode: HTMLElement): DOMConversionOutput | null {
  const footnoteId = domNode.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteId);
  const footnoteIndexStr = domNode.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex);
  
  if (!footnoteId || !footnoteIndexStr) {
    return null;
  }

  const footnoteIndex = parseInt(footnoteIndexStr, 10);
  if (isNaN(footnoteIndex)) {
    return null;
  }

  removeMarkdownBackrefs(domNode);
  const node = $createFootnoteItemNode(footnoteId, footnoteIndex);
  return {
    node,
    after: (childLexicalNodes) => $wrapFootnoteItemChildren(footnoteId, childLexicalNodes),
  };
}

/**
 * Footnotes rendered by our markdown pipeline (markdown-it-footnote) end with
 * a "↩︎" link back to the reference. Lexical renders its own back-link, so
 * drop these (and the space before them) rather than importing them as text.
 */
function removeMarkdownBackrefs(domNode: HTMLElement): void {
  for (const backref of Array.from(domNode.querySelectorAll('a.footnote-backref'))) {
    const previous = backref.previousSibling;
    if (previous?.nodeType === 3 && previous.textContent) {
      previous.textContent = previous.textContent.replace(/\s+$/, '');
    }
    backref.remove();
  }
}

/**
 * HTML from CKEditor or Lexical wraps a footnote's body in a footnote-content
 * div, alongside a back-link span. Footnotes from other sources (notably our
 * markdown renderer) put the body directly inside the <li>; without this,
 * that body ends up outside the footnote content node, where it is invisible
 * to HTML/markdown export and can't be edited.
 */
function $wrapFootnoteItemChildren(footnoteId: string, children: LexicalNode[]): LexicalNode[] {
  if (children.some($isFootnoteContentNode)) {
    return children;
  }
  const content = $createFootnoteContentNode();
  let inlineRun: LexicalNode[] = [];
  for (const child of children) {
    if ($isFootnoteBackLinkNode(child)) {
      continue;
    }
    if ($isTextNode(child) || $isLineBreakNode(child) || $isInlineElementOrDecoratorNode(child)) {
      inlineRun.push(child);
    } else {
      $appendInlineRunAsParagraph(content, inlineRun);
      inlineRun = [];
      content.append(child);
    }
  }
  $appendInlineRunAsParagraph(content, inlineRun);
  if (content.isEmpty()) {
    content.append($createParagraphNode());
  }
  return [$createFootnoteBackLinkNode(footnoteId), content];
}

function $appendInlineRunAsParagraph(content: FootnoteContentNode, inlineRun: LexicalNode[]): void {
  const isWhitespaceOnly = inlineRun.every((node) => $isTextNode(node) && node.getTextContent().trim() === '');
  if (!isWhitespaceOnly) {
    content.append($createParagraphNode().append(...inlineRun));
  }
}

export function $createFootnoteItemNode(
  footnoteId: string,
  footnoteIndex: number
): FootnoteItemNode {
  return new FootnoteItemNode(footnoteId, footnoteIndex);
}

export function $isFootnoteItemNode(
  node: LexicalNode | null | undefined
): node is FootnoteItemNode {
  return node instanceof FootnoteItemNode;
}

