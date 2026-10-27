// EXPERIMENT (branch experiment/iframe-layout-ronny): which side columns the post page's layout lab
// (LayoutLab.tsx) is showing. Null means the lab isn't running and LessWrong's own breakpoints apply.
import { useSyncExternalStore } from 'react';

export interface LayoutLabColumns {
  toc: boolean,
  margin: boolean,
}

const CHANGE_EVENT = 'lw-layout-lab-columns';
let current: LayoutLabColumns | null = null;

export function setLayoutLabColumns(columns: LayoutLabColumns | null) {
  if (current?.toc === columns?.toc && current?.margin === columns?.margin) return;
  current = columns;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** Whether the lab shows the sidenote margin, or null if the lab isn't deciding. */
export function useLayoutLabMarginShown(): boolean | null {
  return useSyncExternalStore(subscribe, () => current?.margin ?? null, () => null);
}
