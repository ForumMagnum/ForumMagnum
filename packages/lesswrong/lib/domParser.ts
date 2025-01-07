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
