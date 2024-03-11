import type { DOMWindow } from "jsdom";
import { isServer } from "./executionEnvironment";

// Note: isServer is defined as `const isServer = bundleIsServer`, but checking against isServer here causes irreparable build errors
const { JSDOM = null } = bundleIsServer ? require('jsdom') : {};

/**
 * A window type that works with jsdom or the browser window
 */
export type WindowType = DOMWindow | Window & typeof globalThis

export function parseDocumentFromString(html: string): {
  document: Document;
  window: WindowType;
} {
  if (isServer) {
    const { window } = new JSDOM(html);
    return { window, document: window.document };
  } else {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");
    return { document, window };
  }
}
