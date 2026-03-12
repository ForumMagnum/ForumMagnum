import { JSDOM } from "jsdom";

/**
 * Sets up a jsdom DOM environment so that Lexical's DOM-dependent helpers
 * ($generateHtmlFromNodes) can run in Node.js.
 *
 * jsdom is used instead of linkedom because Lexical's importDOM code paths
 * access CSS style properties (e.g. style.textDecoration) that linkedom
 * returns as undefined for unset properties, whereas jsdom (like browsers)
 * returns "".
 */
export function withDomGlobals<T>(fn: () => T): T {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const globalWithDom = globalThis as typeof globalThis & {
    document?: Document
    window?: Window & typeof globalThis
  };

  globalWithDom.document = dom.window.document as unknown as Document;
  globalWithDom.window = dom.window as unknown as Window & typeof globalThis;

  try {
    return fn();
  } finally {
    if (previousDocument === undefined) {
      Reflect.deleteProperty(globalWithDom, "document");
    } else {
      globalWithDom.document = previousDocument;
    }
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalWithDom, "window");
    } else {
      globalWithDom.window = previousWindow;
    }
  }
}
