import React from 'react';

/**
 * "Toggle right panel" glyph: a rounded rectangle with a vertical divider near
 * the right, denoting a main area plus a right sidebar. Used for the chat
 * view's file-browser toggle. Strokes with currentColor; size via width/height
 * (defaults to 1em so it scales with font-size).
 */
export const PanelRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    {...props}
  >
    <rect x="2" y="3" width="12" height="10" rx="2" />
    <line x1="10" y1="3" x2="10" y2="13" />
  </svg>
);
