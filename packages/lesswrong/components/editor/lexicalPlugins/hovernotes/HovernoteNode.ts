import {
  $applyNodeReplacement,
  DOMConversion,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  RangeSelection,
  Spread,
} from 'lexical';
import { MarkNode, SerializedMarkNode } from '@lexical/mark';
import { FOOTNOTE_ATTRIBUTES } from '../footnotes/constants';

export const HOVERNOTE_CLASS = 'hovernote';
export const HOVERNOTE_ATTRIBUTE = 'data-hovernote';

export type SerializedHovernoteNode = Spread<
  {
    footnoteId: string;
  },
  SerializedMarkNode
>;

/**
 * HovernoteNode is a variant of a footnote reference: instead of a superscript
 * [n] marker at a single point, it wraps a stretch of highlighted text.
 * Hovering the highlighted text shows the footnote's content in a hover card
 * (both in the editor and in the rendered post). The content itself lives in a
 * regular FootnoteItemNode in the footnote section, so it still shows up in
 * the footnotes list with a number and back-link.
 *
 * Extends MarkNode so that `$wrapSelectionInMarkNode` can wrap arbitrary
 * inline selections (splitting text nodes as needed). The footnoteId is stored
 * as the node's single mark id.
 */
export class HovernoteNode extends MarkNode {
  static getType(): string {
    return 'hovernote';
  }

  static clone(node: HovernoteNode): HovernoteNode {
    return new HovernoteNode(node.__ids[0] ?? '', node.__key);
  }

  constructor(footnoteId: string, key?: NodeKey) {
    super([footnoteId], key);
  }

  getFootnoteId(): string {
    return this.getIDs()[0] ?? '';
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return createHovernoteElement(this.getFootnoteId());
  }

  updateDOM(prevNode: this, element: HTMLElement, _config: EditorConfig): boolean {
    const prevId = prevNode.__ids[0] ?? '';
    const nextId = this.__ids[0] ?? '';
    if (prevId !== nextId) {
      element.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, nextId);
      element.id = `fnref${nextId}`;
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    return { element: createHovernoteElement(this.getFootnoteId()) };
  }

  // MarkNode pins this static's return type to null, so the actual conversion
  // for span[data-hovernote] is registered via FootnoteReferenceNode.importDOM
  // (see hovernoteSpanConversion below). Declared explicitly to silence the
  // custom-exportDOM-without-importDOM dev warning.
  static importDOM(): null {
    return null;
  }

  exportJSON(): SerializedHovernoteNode {
    return {
      ...super.exportJSON(),
      type: 'hovernote',
      footnoteId: this.getFootnoteId(),
    };
  }

  static importJSON(serializedNode: SerializedHovernoteNode): HovernoteNode {
    // The footnoteId is authoritative; MarkNode's `ids` mirror it.
    return $createHovernoteNode(serializedNode.footnoteId)
      .updateFromJSON({ ...serializedNode, ids: [serializedNode.footnoteId] });
  }

  // MarkNodes are excluded from HTML generation by default; hovernotes must
  // survive `$generateHtmlFromNodes`, which is how the document is saved.
  excludeFromCopy(): boolean {
    return false;
  }

  // MarkNode's insertNewAfter creates a plain MarkNode, which would strip the
  // hovernote behavior from the second half when Enter is pressed inside one.
  // Two spans with the same footnoteId is the normal multi-span shape that
  // $wrapSelectionInMarkNode already produces for multi-run selections.
  insertNewAfter(_selection: RangeSelection, restoreSelection = true): HovernoteNode {
    const node = $createHovernoteNode(this.getFootnoteId());
    this.insertAfter(node, restoreSelection);
    return node;
  }
}

function createHovernoteElement(footnoteId: string): HTMLElement {
  const span = document.createElement('span');
  span.className = HOVERNOTE_CLASS;
  span.setAttribute(HOVERNOTE_ATTRIBUTE, '');
  span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, footnoteId);
  span.setAttribute('role', 'doc-noteref');
  // The back-link in the footnote section points at #fnref{id}, same as for
  // regular footnote references. A hovernote spanning multiple runs (e.g.
  // across a paragraph break) is several spans sharing a footnoteId, so this
  // id can appear more than once; the back-link then scrolls to the first
  // fragment, which is the right destination anyway.
  span.id = `fnref${footnoteId}`;
  return span;
}

function convertHovernoteElement(domNode: HTMLElement): DOMConversionOutput | null {
  const footnoteId = domNode.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteId);
  if (!footnoteId) {
    return null;
  }
  return { node: $createHovernoteNode(footnoteId) };
}

/**
 * The DOM conversion for `span[data-hovernote]`, for use from another node's
 * static `importDOM`. It can't live on HovernoteNode itself: MarkNode pins its
 * static `importDOM()` return type to `null`, so a subclass cannot declare one
 * — FootnoteReferenceNode (registered in every editor that has footnotes)
 * hosts it instead.
 */
export function hovernoteSpanConversion(domNode: HTMLElement): DOMConversion | null {
  if (!domNode.hasAttribute(HOVERNOTE_ATTRIBUTE)) {
    return null;
  }
  return {
    conversion: convertHovernoteElement,
    priority: 2,
  };
}

export function $createHovernoteNode(footnoteId: string): HovernoteNode {
  return $applyNodeReplacement(new HovernoteNode(footnoteId));
}

export function $isHovernoteNode(
  node: LexicalNode | null | undefined
): node is HovernoteNode {
  return node instanceof HovernoteNode;
}
