import type { DOMWindow } from "jsdom";
import { isServer } from "./executionEnvironment";

// Note: isServer is defined as `const isServer = bundleIsServer`, but checking
// against isServer here isn't sufficient to prevent the require from making it
// into the client bundle.
const { parseHTML = null } = bundleIsServer ? require('linkedom') : {};

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
  if (isServer) {
    const { document, window } = parseHTML(`<html><body>${html}</body></html>`);
    return { document, window };
  } else {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");
    return { document, window };
  }
}
