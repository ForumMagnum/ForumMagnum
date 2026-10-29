// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2's edits, kept in this browser, so the
// Post tab shows what was done in the Editor tab and the Editor tab picks up where it was left. Nothing
// is sent anywhere. Edits made to an older version of the demo post (before a redeploy) are dropped.

// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3 keeps each of its demo posts' edits
// under its own key (see widgetBlocksDemo.ts); Experiment 2 keeps this one.
export const WIDGET_DRAG_STORAGE_KEY = 'lwWidgetDragEdits';

interface StoredEdits {
  /** Fingerprint of the demo post the edits started from (see demoFingerprint). */
  base: string;
  html: string;
}

/** A short fingerprint of the demo post's HTML, so edits to an older version are not shown. */
export function demoFingerprint(html: string): string {
  let hash = 5381;
  for (let i = 0; i < html.length; i++) hash = ((hash * 33) ^ html.charCodeAt(i)) >>> 0;
  return `${html.length.toString(36)}-${hash.toString(36)}`;
}

/** The edited post's HTML (as the editor exports it), or null if there are no edits to this version. */
export function loadEdits(base: string, storageKey = WIDGET_DRAG_STORAGE_KEY): string | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredEdits>;
    return stored.base === base && typeof stored.html === 'string' ? stored.html : null;
  } catch {
    return null;
  }
}

let unsavedSince = 0;
let waiting: Array<() => void> = [];

export function saveEdits(base: string, html: string, storageKey = WIDGET_DRAG_STORAGE_KEY): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ base, html } satisfies StoredEdits));
  } catch {
    // Storage can be unavailable (private windows, blocked site data): edits just aren't kept.
  }
  unsavedSince = 0;
  waiting.forEach(resolve => resolve());
  waiting = [];
}

export function clearEdits(storageKey = WIDGET_DRAG_STORAGE_KEY): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage can be unavailable (private windows, blocked site data): edits just aren't kept.
  }
  unsavedSince = 0;
}

/** The editor changed: its HTML reaches saveEdits a moment later (the editor batches changes). */
export function markEditsUnsaved(): void {
  if (!unsavedSince) unsavedSince = Date.now();
}

/** Resolves once the last change is saved, or after `timeoutMs`. */
export function editsSaved(timeoutMs = 1500): Promise<void> {
  if (!unsavedSince) return Promise.resolve();
  return new Promise((resolve) => {
    waiting.push(resolve);
    setTimeout(resolve, timeoutMs);
  });
}

/**
 * The editor's HTML as the post page renders it: each widget iframe becomes the placeholder the server
 * leaves in a saved post, and its HTML goes in `srcdocs` (see IframeWidgetSrcdocOverrides) rather than
 * being fetched by id.
 */
export function editsForReader(html: string): { html: string, srcdocs: Record<string, string> } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const srcdocs: Record<string, string> = {};
  doc.querySelectorAll('iframe[data-lexical-iframe-widget]').forEach((iframe, i) => {
    const id = `edited-widget-${i}`;
    srcdocs[id] = iframe.getAttribute('srcdoc') ?? '';
    const placeholder = doc.createElement('div');
    placeholder.className = 'iframe-widget';
    placeholder.setAttribute('data-iframe-widget-id', id);
    iframe.replaceWith(placeholder);
  });
  return { html: doc.body.innerHTML, srcdocs };
}
