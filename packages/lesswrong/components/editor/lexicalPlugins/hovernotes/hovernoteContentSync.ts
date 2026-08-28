import {
  $createParagraphNode,
  $isElementNode,
  $isDecoratorNode,
  ElementNode,
  LexicalEditor,
  ParagraphNode,
} from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { parseDocumentFromString } from '@/lib/domParser';
import { FOOTNOTE_CLASSES } from '../footnotes/constants';
import { $getFootnoteItems } from '../footnotes/helpers';
import { $isFootnoteContentNode, FootnoteContentNode } from '../footnotes/FootnoteContentNode';

/**
 * Read the current HTML of a footnote's content, straight from the editor's
 * DOM (the same source the sidenotes plugin renders from).
 */
export function getFootnoteContentHtml(editor: LexicalEditor, footnoteId: string): string {
  const rootElement = editor.getRootElement();
  if (!rootElement) {
    return '';
  }
  const footnoteElement = rootElement.ownerDocument.getElementById(`fn${footnoteId}`);
  if (!(footnoteElement instanceof HTMLElement) || !rootElement.contains(footnoteElement)) {
    return '';
  }
  const contentElement = footnoteElement.querySelector(`.${FOOTNOTE_CLASSES.footnoteContent}`);
  return contentElement instanceof HTMLElement ? contentElement.innerHTML : '';
}

function $findFootnoteContentNode(footnoteId: string): FootnoteContentNode | null {
  const item = $getFootnoteItems().find((i) => i.getFootnoteId() === footnoteId);
  if (!item) {
    return null;
  }
  return item.getChildren().find((child) => $isFootnoteContentNode(child)) ?? null;
}

/**
 * Parse `html` and append the resulting nodes to `container` as block
 * children. Must be called inside an editor update. $generateNodesFromDOM can
 * return top-level inline nodes (text, links); containers like
 * FootnoteContentNode and the popup editor's root expect block children, so
 * runs of inline nodes get wrapped in paragraphs.
 */
export function $appendHtmlAsBlocks(editor: LexicalEditor, container: ElementNode, html: string): void {
  const { document: dom } = parseDocumentFromString(html);
  const nodes = $generateNodesFromDOM(editor, dom);
  let currentParagraph: ParagraphNode | null = null;
  for (const node of nodes) {
    const isBlock = ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline();
    if (isBlock) {
      currentParagraph = null;
      container.append(node);
    } else {
      if (!currentParagraph) {
        currentParagraph = $createParagraphNode();
        container.append(currentParagraph);
      }
      currentParagraph.append(node);
    }
  }
  if (container.getChildrenSize() === 0) {
    container.append($createParagraphNode());
  }
}

/** Whether the given HTML has no visible text content. */
export function isBlankHtml(html: string): boolean {
  if (!html.trim()) {
    return true;
  }
  const { document: dom } = parseDocumentFromString(html);
  return !(dom.body?.textContent ?? '').trim();
}

/**
 * Replace a footnote's content with the given HTML (as edited in the hovernote
 * popup, or returned by autogeneration).
 */
export function writeFootnoteContentHtml(editor: LexicalEditor, footnoteId: string, html: string): void {
  editor.update(() => {
    const content = $findFootnoteContentNode(footnoteId);
    if (!content) {
      return;
    }
    content.clear();
    $appendHtmlAsBlocks(editor, content, html);
  });
}
