import type { DOMWindow } from "jsdom";
import { parseHTML } from "@/server/utils/wrapLinkedom";

/**
 * A window type that works with jsdom or the browser window
 */
export type WindowType = DOMWindow | Window & typeof globalThis

/**
 * Version of DOMParser().parseFromString that can be used server-side (including during SSR)
 */
export function parseDocumentFromString(html: string): {
  document: Document;
  window: WindowType;
} {
  if (bundleIsServer) {
    const { document, window } = parseHTML(`<html><body>${html}</body></html>`);
    return { document, window };
  } else {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");
    return { document, window };
  }
}

// Vendored from typescript/lib/lib.dom.d.ts, as Node is only available as a global on the client
export const ServerSafeNode = {
  /** node is an element. */
  ELEMENT_NODE: 1 as const,
  /** node is an attribute. */
  ATTRIBUTE_NODE: 2 as const,
  /** node is a Text node. */
  TEXT_NODE: 3 as const,
  /** node is a CDATASection node. */
  CDATA_SECTION_NODE: 4 as const,
  /** node is an entity reference. */
  ENTITY_REFERENCE_NODE: 5 as const,
  /** node is an entity. */
  ENTITY_NODE: 6 as const,
  /** node is a ProcessingInstruction node. */
  PROCESSING_INSTRUCTION_NODE: 7 as const,
  /** node is a Comment node. */
  COMMENT_NODE: 8 as const,
  /** node is a document. */
  DOCUMENT_NODE: 9 as const,
  /** node is a doctype. */
  DOCUMENT_TYPE_NODE: 10 as const,
  /** node is a DocumentFragment node. */
  DOCUMENT_FRAGMENT_NODE: 11 as const,
  /** node is a notation. */
  NOTATION_NODE: 12 as const,
  /** Set when node and other are not in the same tree. */
  DOCUMENT_POSITION_DISCONNECTED: 0x01 as const,
  /** Set when other is preceding node. */
  DOCUMENT_POSITION_PRECEDING: 0x02 as const,
  /** Set when other is following node. */
  DOCUMENT_POSITION_FOLLOWING: 0x04 as const,
  /** Set when other is an ancestor of node. */
  DOCUMENT_POSITION_CONTAINS: 0x08 as const,
  /** Set when other is a descendant of node. */
  DOCUMENT_POSITION_CONTAINED_BY: 0x10 as const,
  /** Set when the position is implementation-specific. */
  DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 0x20 as const,
};
