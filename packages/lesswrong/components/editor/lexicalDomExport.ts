import {
  type DOMExportOutput,
  type DOMExportOutputMap,
  type LexicalEditor,
  type LexicalNode,
  TextNode,
} from 'lexical';

function wrapElementWith(element: HTMLElement, tag: string): HTMLElement {
  const wrapper = document.createElement(tag);
  wrapper.appendChild(element);
  return wrapper;
}

/**
 * Custom TextNode export that produces non-redundant HTML.
 *
 * Lexical's built-in TextNode.exportDOM calls createDOM (which renders
 * <strong>/<em> based on getElementInnerTag) and then wraps the result
 * with <b>/<i>/<s>/<u>.  This causes doubled markup (e.g.
 * <b><strong>text</strong></b>) which downstream consumers like Turndown
 * convert into doubled Markdown markers (****text****).
 *
 * This override builds the export HTML from scratch, wrapping a plain
 * <span> with exactly one semantic element per active format.
 */
function exportTextNode(_editor: LexicalEditor, target: LexicalNode): DOMExportOutput {
  if (!(target instanceof TextNode)) {
    return { element: null };
  }

  const span = document.createElement('span');
  span.style.whiteSpace = 'pre-wrap';
  span.textContent = target.getTextContent();

  if (target.hasFormat('lowercase')) {
    span.style.textTransform = 'lowercase';
  } else if (target.hasFormat('uppercase')) {
    span.style.textTransform = 'uppercase';
  } else if (target.hasFormat('capitalize')) {
    span.style.textTransform = 'capitalize';
  }

  const nodeStyle = target.getStyle();
  if (nodeStyle) {
    span.style.cssText = span.style.cssText + '; ' + nodeStyle;
  }

  let element: HTMLElement = span;
  if (target.hasFormat('code')) {
    element = wrapElementWith(element, 'code');
  }
  if (target.hasFormat('highlight')) {
    element = wrapElementWith(element, 'mark');
  }
  // Use <b> and <i> rather than <strong> and <em> for clipboard
  // compatibility with external paste targets (Google Docs, Word, etc.)
  if (target.hasFormat('bold')) {
    element = wrapElementWith(element, 'b');
  }
  if (target.hasFormat('italic')) {
    element = wrapElementWith(element, 'i');
  }
  if (target.hasFormat('strikethrough')) {
    element = wrapElementWith(element, 's');
  }
  if (target.hasFormat('subscript')) {
    element = wrapElementWith(element, 'sub');
  }
  if (target.hasFormat('superscript')) {
    element = wrapElementWith(element, 'sup');
  }

  return { element };
}

/**
 * Build a DOMExportOutputMap with the TextNode export override.
 * Callers can extend the returned map with additional entries.
 */
function buildTextNodeExportMap(): DOMExportOutputMap {
  const map: DOMExportOutputMap = new Map();
  map.set(TextNode, exportTextNode);
  return map;
}

export { exportTextNode, buildTextNodeExportMap };
