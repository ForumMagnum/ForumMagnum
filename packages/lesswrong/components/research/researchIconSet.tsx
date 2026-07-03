import React from 'react';

/**
 * The hand-drawn monochrome icon set for research documents and conversations
 * — the full palette offered by the icon picker (the Unicode emoji picker was
 * retired in favor of this set; previously stored emoji still render). Drawn
 * on a 24px grid with a 1.6px stroke (matching the line weight of the
 * sidebar's Lucide-style glyphs), stroked in currentColor so they pick up the
 * warm grey text tones and invert in dark mode.
 *
 * Selections are stored in the existing `icon` text field as `svg:<id>`
 * (legacy Unicode emoji are stored as the bare character); render either kind
 * with <ResearchItemIcon />.
 */

export const RESEARCH_SVG_ICON_PREFIX = 'svg:';

export interface ResearchIconDef {
  id: string;
  label: string;
  /** Stroked <path> d-strings. */
  paths?: string[];
  /** Stroked circles: [cx, cy, r]. */
  circles?: Array<readonly [number, number, number]>;
  /** Stroked ellipses: [cx, cy, rx, ry]. */
  ellipses?: Array<readonly [number, number, number, number]>;
  /** Filled circles with an explicit radius (event horizons, etc). */
  discs?: Array<readonly [number, number, number]>;
  /** Small filled dots (pips, pupils, points): [cx, cy]. */
  dots?: Array<readonly [number, number]>;
}

export interface ResearchIconGroup {
  title: string;
  icons: ResearchIconDef[];
}

export const RESEARCH_ICON_GROUPS: ResearchIconGroup[] = [
  {
    title: 'Marks & status',
    icons: [
      {
        id: 'star', label: 'Star',
        paths: ['M12 3.3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z'],
      },
      {
        id: 'heart', label: 'Heart',
        paths: ['M12 20.1c-4.8-3.1-7.8-6.4-7.8-9.9 0-2.7 1.8-4.6 4.1-4.6 1.5 0 2.9.8 3.7 2.1.8-1.3 2.2-2.1 3.7-2.1 2.3 0 4.1 1.9 4.1 4.6 0 3.5-3 6.8-7.8 9.9z'],
      },
      {
        id: 'check', label: 'Done',
        circles: [[12, 12, 8.7]],
        paths: ['m8.1 12.4 2.7 2.7 5.1-6'],
      },
      {
        id: 'xmark', label: 'Dead end',
        circles: [[12, 12, 8.7]],
        paths: ['m9.1 9.1 5.8 5.8', 'm14.9 9.1-5.8 5.8'],
      },
      {
        id: 'warning', label: 'Warning',
        paths: [
          'M10.4 4.5 2.9 17.4a1.85 1.85 0 0 0 1.6 2.8h15a1.85 1.85 0 0 0 1.6-2.8L13.6 4.5a1.85 1.85 0 0 0-3.2 0z',
          'M12 9.3v4.6',
        ],
        dots: [[12, 16.9]],
      },
      {
        id: 'bolt', label: 'Lightning',
        paths: ['M13.2 3.2 5.7 13.4h4.9l-.6 7.4 7.5-10.2h-4.9z'],
      },
      {
        id: 'fire', label: 'Fire',
        paths: ['M12 20.8c-3.7 0-6.2-2.4-6.2-5.8 0-2.4 1.3-4.3 2.7-5.9.3.9.8 1.7 1.6 2.2-.2-2.4.7-5.2 3.1-7.1-.1 1.9.7 3.2 1.9 4.5 1.3 1.4 3.1 2.9 3.1 6.3 0 3.4-2.5 5.8-6.2 5.8z'],
      },
      {
        id: 'snowflake', label: 'Frozen',
        paths: [
          'M12 3.5v17',
          'M4.6 7.75l14.8 8.5',
          'M19.4 7.75 4.6 16.25',
          'M9.9 5.1 12 7.2l2.1-2.1',
          'M9.9 18.9 12 16.8l2.1 2.1',
        ],
      },
    ],
  },
  {
    title: 'Time',
    icons: [
      {
        id: 'clock', label: 'Clock',
        circles: [[12, 12, 8.7]],
        paths: ['M12 7v5l3.2 1.9'],
      },
      {
        id: 'stopwatch', label: 'Stopwatch',
        circles: [[12, 13.5, 7]],
        paths: ['M9.9 3.5h4.2', 'M12 3.5v3', 'M12 13.5l2.9-2.9'],
      },
      {
        id: 'sun', label: 'Sun',
        circles: [[12, 12, 4]],
        paths: [
          'M12 3v2.2', 'M12 18.8V21', 'M3 12h2.2', 'M18.8 12H21',
          'M5.6 5.6l1.6 1.6', 'M16.8 16.8l1.6 1.6', 'M18.4 5.6l-1.6 1.6', 'M7.2 16.8l-1.6 1.6',
        ],
      },
      {
        id: 'moon', label: 'Moon',
        paths: ['M12.4 3.3a6.9 6.9 0 0 0 8.3 8.3 8.9 8.9 0 1 1-8.3-8.3z'],
      },
      {
        id: 'calendar', label: 'Calendar',
        paths: [
          'M5.2 5.5h13.6a1.7 1.7 0 0 1 1.7 1.7v11.1a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2a1.7 1.7 0 0 1 1.7-1.7z',
          'M3.5 10.2h17',
          'M8.3 3.3v4',
          'M15.7 3.3v4',
        ],
      },
    ],
  },
  {
    title: 'Research & analysis',
    icons: [
      {
        id: 'search', label: 'Magnifying glass',
        circles: [[11, 11, 6.5]],
        paths: ['M15.8 15.8 20.5 20.5'],
      },
      {
        id: 'lightbulb', label: 'Lightbulb',
        paths: [
          'M12 3a6.2 6.2 0 0 0-3.7 11.2c.9.7 1.45 1.7 1.6 2.8h4.2c.15-1.1.7-2.1 1.6-2.8A6.2 6.2 0 0 0 12 3z',
          'M9.9 20.5h4.2',
        ],
      },
      {
        id: 'flask', label: 'Flask',
        paths: [
          'M9.7 3.5h4.6',
          'M10.2 3.5v5.8L4.8 18.6a1.7 1.7 0 0 0 1.5 2.5h11.4a1.7 1.7 0 0 0 1.5-2.5L13.8 9.3V3.5',
          'M7.4 14.5h9.2',
        ],
      },
      {
        id: 'telescope', label: 'Telescope',
        paths: [
          'M4.5 15.5 14.6 5.4l4 4L8.5 19.5z',
          'M6.7 13.3l4 4',
          'M20.2 3v3',
          'M18.7 4.5h3',
        ],
      },
      {
        id: 'brain', label: 'Brain',
        paths: [
          'M12 4.3c-4.4 0-7.9 3.5-7.9 7.8 0 4.1 3.4 7.6 7.9 7.6s7.9-3.5 7.9-7.6c0-4.3-3.5-7.8-7.9-7.8z',
          'M12 4.3v15.4',
          'M8.6 7.2c1.2.6 1.2 2.3 0 2.9s-1.2 2.3 0 2.9 1.2 2.3 0 2.9',
          'M15.4 7.2c-1.2.6-1.2 2.3 0 2.9s1.2 2.3 0 2.9-1.2 2.3 0 2.9',
        ],
      },
      {
        id: 'question', label: 'Open question',
        circles: [[12, 12, 8.7]],
        paths: ['M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.3-.9.8-.9 1.6v.4'],
        dots: [[12, 16.8]],
      },
      {
        id: 'scales', label: 'Scales',
        paths: [
          'M12 3.5v17',
          'M8.5 20.5h7',
          'M5 6.5h14',
          'M3.4 12.5 6 6.5l2.6 6a2.7 2.7 0 0 1-5.2 0z',
          'M15.4 12.5 18 6.5l2.6 6a2.7 2.7 0 0 1-5.2 0z',
        ],
      },
      {
        id: 'eye', label: 'Observation',
        circles: [[12, 12, 2.6]],
        paths: ['M2.8 12c2-3.7 5.2-5.8 9.2-5.8s7.2 2.1 9.2 5.8c-2 3.7-5.2 5.8-9.2 5.8S4.8 15.7 2.8 12z'],
      },
      {
        id: 'crystalball', label: 'Forecasting',
        circles: [[12, 10.7, 6.9]],
        paths: ['M8.1 19.1h7.8l1 2H7.1z', 'M8.9 8.4a4.4 4.4 0 0 1 2.6-1.9'],
      },
      {
        id: 'prism', label: 'Decomposition',
        paths: [
          'M12 4 4.5 17.5h15z',
          'M2.3 8.8 8.25 10.75',
          'M15.75 10.75 21.7 8.6',
          'M15.75 10.75 21.7 13',
        ],
      },
      {
        id: 'venn', label: 'Comparison',
        circles: [[9.3, 12, 5.3], [14.7, 12, 5.3]],
      },
      {
        id: 'puzzle', label: 'Open problem',
        paths: ['M6.5 9.5h2.9a2.1 2.1 0 1 1 4.2 0h2.9v2.9a2.1 2.1 0 1 1 0 4.2v2.9H6.5z'],
      },
      {
        id: 'maze', label: 'Maze',
        paths: ['M12.2 12.2h2.4v3H9.6V9h6v9.2H6.6V6h11.2v13.8'],
      },
    ],
  },
  {
    title: 'Data & charts',
    icons: [
      {
        id: 'barchart', label: 'Bar chart',
        paths: ['M3.8 20.5h16.4', 'M7 20.5v-8', 'M12 20.5v-14', 'M17 20.5V10'],
      },
      {
        id: 'trend', label: 'Trend',
        paths: ['M3.5 17.5 9 12l3.5 3.5 7-7', 'M14.8 8.5h4.7v4.7'],
      },
      {
        id: 'sigma', label: 'Math',
        paths: ['M17 7V5.5H7l5.8 6.5L7 18.5h10V17'],
      },
      {
        id: 'table', label: 'Table',
        paths: [
          'M5.2 4.5h13.6a1.7 1.7 0 0 1 1.7 1.7v11.6a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V6.2a1.7 1.7 0 0 1 1.7-1.7z',
          'M3.5 10h17',
          'M10.5 10v9.5',
        ],
      },
      {
        id: 'dice', label: 'Probability',
        paths: ['M6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v10.4a2.8 2.8 0 0 1-2.8 2.8H6.8A2.8 2.8 0 0 1 4 17.2V6.8A2.8 2.8 0 0 1 6.8 4z'],
        dots: [[8.6, 8.6], [15.4, 8.6], [12, 12], [8.6, 15.4], [15.4, 15.4]],
      },
      {
        id: 'gauge', label: 'Performance',
        paths: ['M5.3 16.9a7.8 7.8 0 1 1 13.4 0', 'M12 14.3l3.5-4.4'],
        dots: [[12, 14.3]],
      },
      {
        id: 'funnel', label: 'Filter',
        paths: ['M4 4.5h16l-6.2 7.4v6.3l-3.6 1.8v-8.1z'],
      },
      {
        id: 'sliders', label: 'Tuning',
        circles: [[9.5, 7, 1.8], [15, 12, 1.8], [7.5, 17, 1.8]],
        paths: [
          'M4 7h3.7', 'M11.3 7H20',
          'M4 12h9.2', 'M16.8 12H20',
          'M4 17h1.7', 'M9.3 17H20',
        ],
      },
    ],
  },
  {
    title: 'Writing & documents',
    icons: [
      {
        id: 'page', label: 'Document',
        paths: [
          'M13.8 3.5H7.2A1.7 1.7 0 0 0 5.5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h9.6a1.7 1.7 0 0 0 1.7-1.7V8.2z',
          'M13.8 3.5v4.7h4.7',
        ],
      },
      {
        id: 'book', label: 'Book',
        paths: [
          'M6.8 3.5A2.3 2.3 0 0 0 4.5 5.8v12.4A2.3 2.3 0 0 1 6.8 16h12.7V3.5z',
          'M4.5 18.2a2.3 2.3 0 0 0 2.3 2.3h12.7V16',
        ],
      },
      {
        id: 'quote', label: 'Quote',
        circles: [[8.2, 9.6, 2.1], [15.8, 9.6, 2.1]],
        paths: [
          'M10.3 9.9c-.1 2.6-1.3 4.4-3.6 5.4',
          'M17.9 9.9c-.1 2.6-1.3 4.4-3.6 5.4',
        ],
      },
      {
        id: 'pencil', label: 'Draft',
        paths: [
          'm4.5 19.5.8-3.3L16.7 4.8a1.9 1.9 0 0 1 2.7 2.7L8 18.9l-3.5.6z',
          'M14.8 6.7l2.7 2.7',
        ],
      },
      {
        id: 'archive', label: 'Archive',
        paths: [
          'M4.5 4.5h15a1 1 0 0 1 1 1V7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z',
          'M5 8.5v9.3a1.7 1.7 0 0 0 1.7 1.7h10.6a1.7 1.7 0 0 0 1.7-1.7V8.5',
          'M10 12.5h4',
        ],
      },
      {
        id: 'bookmark', label: 'Bookmark',
        paths: ['M7 3.5h10a.9.9 0 0 1 .9.9v16.1L12 16.6 6.1 20.5V4.4a.9.9 0 0 1 .9-.9z'],
      },
      {
        id: 'folder', label: 'Folder',
        paths: ['M3.5 6.7A1.7 1.7 0 0 1 5.2 5h4l2.2 2.5h7.4a1.7 1.7 0 0 1 1.7 1.7v8.6a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z'],
      },
      {
        id: 'inbox', label: 'Inbox',
        paths: [
          'M5.9 5.9 3.5 13v4a1.7 1.7 0 0 0 1.7 1.7h13.6a1.7 1.7 0 0 0 1.7-1.7v-4l-2.4-7.1a1.7 1.7 0 0 0-1.6-1.2H7.5a1.7 1.7 0 0 0-1.6 1.2z',
          'M3.5 13h5.2l1.5 2.6h3.6l1.5-2.6h5.2',
        ],
      },
      {
        id: 'envelope', label: 'Mail',
        paths: [
          'M5.2 5.5h13.6a1.7 1.7 0 0 1 1.7 1.7v9.6a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2a1.7 1.7 0 0 1 1.7-1.7z',
          'm4 6.7 8 6.3 8-6.3',
        ],
      },
      {
        id: 'tag', label: 'Tag',
        paths: ['M3.5 9.9V5.1c0-.9.7-1.6 1.6-1.6h4.8c.4 0 .8.2 1.1.5l8.9 8.9c.6.6.6 1.6 0 2.3l-4.8 4.8c-.6.6-1.6.6-2.3 0l-8.9-8.9a1.6 1.6 0 0 1-.4-1.2z'],
        dots: [[7.4, 7.4]],
      },
      {
        id: 'pin', label: 'Pin',
        circles: [[12, 10.4, 2.3]],
        paths: ['M12 21c-4.3-3.9-6.5-7.4-6.5-10.5a6.5 6.5 0 0 1 13 0c0 3.1-2.2 6.6-6.5 10.5z'],
      },
    ],
  },
  {
    title: 'Code & systems',
    icons: [
      {
        id: 'terminal', label: 'Terminal',
        paths: [
          'M4.7 4.5h14.6a1.7 1.7 0 0 1 1.7 1.7v11.6a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 17.8V6.2a1.7 1.7 0 0 1 1.7-1.7z',
          'm7 9 3 3-3 3',
          'M12.5 15.5H17',
        ],
      },
      {
        id: 'code', label: 'Code',
        paths: ['m8.5 6.5-5.5 5.5 5.5 5.5', 'm15.5 6.5 5.5 5.5-5.5 5.5'],
      },
      {
        id: 'branch', label: 'Git branch',
        circles: [[6, 5.5, 2.1], [6, 18.5, 2.1], [18, 7.5, 2.1]],
        paths: ['M6 7.6v8.8', 'M18 9.6c0 4.6-3.7 8.4-8.3 8.4h-1.4'],
      },
      {
        id: 'database', label: 'Database',
        ellipses: [[12, 5.8, 7.5, 2.8]],
        paths: [
          'M4.5 5.8v12.4c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V5.8',
          'M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8',
        ],
      },
      {
        id: 'bug', label: 'Bug',
        paths: [
          'M12 7.5a4.3 4.3 0 0 1 4.3 4.3v3.4a4.3 4.3 0 0 1-8.6 0v-3.4A4.3 4.3 0 0 1 12 7.5z',
          'M8.8 6.8 7 5',
          'M15.2 6.8 17 5',
          'M7.7 12H4.5',
          'M7.7 15.5H5',
          'M16.3 12h3.2',
          'M16.3 15.5H19',
          'M12 7.5v11.9',
        ],
      },
      {
        id: 'gear', label: 'Configuration',
        circles: [[12, 12, 3]],
        paths: [
          'M19.4 13.6a7.6 7.6 0 0 0 0-3.2l1.7-1.3-1.5-2.6-2 .8a7.6 7.6 0 0 0-2.8-1.6l-.3-2.2h-3l-.3 2.2a7.6 7.6 0 0 0-2.8 1.6l-2-.8-1.5 2.6 1.7 1.3a7.6 7.6 0 0 0 0 3.2l-1.7 1.3 1.5 2.6 2-.8a7.6 7.6 0 0 0 2.8 1.6l.3 2.2h3l.3-2.2a7.6 7.6 0 0 0 2.8-1.6l2 .8 1.5-2.6z',
        ],
      },
      {
        id: 'layers', label: 'Architecture',
        paths: [
          'M12 3 20.5 7.6 12 12.2 3.5 7.6z',
          'M5.2 11.4 3.5 12.3 12 16.9l8.5-4.6-1.7-.9',
          'M5.2 16 3.5 16.9 12 21.5l8.5-4.6-1.7-.9',
        ],
      },
      {
        id: 'chip', label: 'Compute',
        paths: [
          'M8.6 7.5h6.8a1.1 1.1 0 0 1 1.1 1.1v6.8a1.1 1.1 0 0 1-1.1 1.1H8.6a1.1 1.1 0 0 1-1.1-1.1V8.6a1.1 1.1 0 0 1 1.1-1.1z',
          'M10.8 10.8h2.4v2.4h-2.4z',
          'M9.5 7.5V4.8', 'M14.5 7.5V4.8', 'M9.5 19.2v-2.7', 'M14.5 19.2v-2.7',
          'M7.5 9.5H4.8', 'M7.5 14.5H4.8', 'M19.2 9.5h-2.7', 'M19.2 14.5h-2.7',
        ],
      },
      {
        id: 'link', label: 'Link',
        paths: [
          'M9.5 14.5 14.5 9.5',
          'M10.8 6.8l1.8-1.8a4 4 0 0 1 5.7 5.7l-1.8 1.8',
          'M13.2 17.2l-1.8 1.8a4 4 0 0 1-5.7-5.7l1.8-1.8',
        ],
      },
      {
        id: 'wrench', label: 'Tooling',
        paths: ['M14.7 6.7a1 1 0 0 0-.3.7v2.2a1 1 0 0 0 1 1h2.2a1 1 0 0 0 .7-.3l2.3-2.3a5.2 5.2 0 0 1-6.9 6.4L7.2 21a2.12 2.12 0 0 1-3-3l6.6-6.5a5.2 5.2 0 0 1 6.4-6.9z'],
      },
      {
        id: 'hammer', label: 'Building',
        paths: [
          'm14.1 12.9-7.3 7.3a2 2 0 0 1-2.9-2.9l7.3-7.3',
          'm16 16 5.9-5.9',
          'm8.1 8.1 5.9-5.9',
          'm9.1 7.1 7.8 7.8',
          'm21 11.1-8.1-8.1',
        ],
      },
    ],
  },
  {
    title: 'AI & agents',
    icons: [
      {
        id: 'robot', label: 'Agent',
        circles: [[12, 4.2, 1.2]],
        paths: [
          'M6.8 8.5h10.4a1.9 1.9 0 0 1 1.9 1.9v7.2a1.9 1.9 0 0 1-1.9 1.9H6.8a1.9 1.9 0 0 1-1.9-1.9v-7.2a1.9 1.9 0 0 1 1.9-1.9z',
          'M12 8.5V5.4',
          'M9.3 16h5.4',
        ],
        dots: [[9.4, 12.6], [14.6, 12.6]],
      },
      {
        id: 'network', label: 'Network',
        circles: [[6, 5.5, 2.2], [18, 5.5, 2.2], [12, 18, 2.2]],
        paths: ['M8.2 5.5h7.6', 'M6.95 7.5l4.1 8.5', 'M17.05 7.5 12.95 16'],
      },
      {
        id: 'sparkle', label: 'Generative',
        paths: [
          'M11 3.5c.7 4.7 3.1 7.1 7.8 7.8-4.7.7-7.1 3.1-7.8 7.8-.7-4.7-3.1-7.1-7.8-7.8 4.7-.7 7.1-3.1 7.8-7.8z',
          'M18.7 15.9v3.6',
          'M16.9 17.7h3.6',
        ],
      },
    ],
  },
  {
    title: 'Planning & strategy',
    icons: [
      {
        id: 'checklist', label: 'Checklist',
        paths: [
          'M5.2 4.6h3.2a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1z',
          'm5.8 7.1 1.1 1.1 1.9-2.4',
          'M5.2 14.2h3.2a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1v-3.2a1 1 0 0 1 1-1z',
          'M12.5 7.2H20',
          'M12.5 16.8H20',
        ],
      },
      {
        id: 'target', label: 'Goal',
        circles: [[12, 12, 8.3], [12, 12, 4.9]],
        dots: [[12, 12]],
      },
      {
        id: 'flag', label: 'Milestone',
        paths: [
          'M6 21V3.8',
          'M6 4.6c1.9-1.2 3.9-1.2 6 0s4.1 1.2 6 0v8.6c-1.9 1.2-3.9 1.2-6 0s-4.1-1.2-6 0z',
        ],
      },
      {
        id: 'knight', label: 'Game theory',
        paths: [
          'M7 20.5h10',
          'M8.3 18.5c.2-3.5 1.2-5.9 3.2-7.7l-2.7 1.1c-1.1.4-2.1-.6-1.7-1.7l1.5-3.6C9.9 3.7 12.3 2.4 15 3.1c2.4.7 3.6 2.9 3.4 5.8l-.9 9.6',
          'm13.2 4.6 1-1.8 1.4 1.9',
        ],
        dots: [[13.6, 7.4]],
      },
      {
        id: 'domino', label: 'Cascade',
        paths: [
          'M8.6 3.5h6.8a1.4 1.4 0 0 1 1.4 1.4v14.2a1.4 1.4 0 0 1-1.4 1.4H8.6a1.4 1.4 0 0 1-1.4-1.4V4.9a1.4 1.4 0 0 1 1.4-1.4z',
          'M7.2 12h9.6',
        ],
        dots: [[10.5, 6.8], [13.5, 9.2], [10.5, 14.6], [12, 16.2], [13.5, 17.8]],
      },
      {
        id: 'chat', label: 'Discussion',
        paths: ['M20 13.7a2.3 2.3 0 0 1-2.3 2.3H9.6L4 20.3V6.8a2.3 2.3 0 0 1 2.3-2.3h11.4A2.3 2.3 0 0 1 20 6.8z'],
      },
      {
        id: 'key', label: 'Secrets',
        circles: [[8, 16, 3.6]],
        paths: ['m10.6 13.4 8.9-8.9', 'M16.4 7.6l2.4 2.4', 'M13.4 10.6l1.9 1.9'],
      },
      {
        id: 'lock', label: 'Private',
        paths: [
          'M6.6 10.5h10.8a1.6 1.6 0 0 1 1.6 1.6v6.3a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 18.4v-6.3a1.6 1.6 0 0 1 1.6-1.6z',
          'M8.2 10.5V7.3a3.8 3.8 0 0 1 7.6 0v3.2',
        ],
        dots: [[12, 15.2]],
      },
      {
        id: 'shield', label: 'Defense',
        paths: ['M12 3.5c2.4 1.2 4.9 1.9 7.4 2.1v6.1c0 4.5-2.9 7.7-7.4 9.2-4.5-1.5-7.4-4.7-7.4-9.2V5.6c2.5-.2 5-.9 7.4-2.1z'],
      },
      {
        id: 'trash', label: 'Deprecated',
        paths: [
          'M4.5 6.5h15',
          'M9.5 6.5V4.9a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v1.6',
          'M6.3 6.5l.8 12.4a1.7 1.7 0 0 0 1.7 1.6h6.4a1.7 1.7 0 0 0 1.7-1.6l.8-12.4',
          'M10 10.5v6',
          'M14 10.5v6',
        ],
      },
      {
        id: 'scissors', label: 'Cuts',
        circles: [[6.4, 7, 2.3], [6.4, 17, 2.3]],
        paths: ['M8.4 8.3 20 15.8', 'M8.4 15.7 20 8.2'],
      },
      {
        id: 'rocket', label: 'Launch',
        circles: [[12, 10.3, 1.7]],
        paths: [
          'M12 3.1c2.9 1.8 4.6 5 4.6 8.8 0 1.4-.2 2.7-.6 3.9H8c-.4-1.2-.6-2.5-.6-3.9 0-3.8 1.7-7 4.6-8.8z',
          'M7.4 12.9 4.9 17l3.1-.2z',
          'M16.6 12.9 19.1 17l-3.1-.2z',
          'M10.4 18.6c0 1.3.5 2.4 1.6 3.3 1.1-.9 1.6-2 1.6-3.3',
        ],
      },
    ],
  },
  {
    title: 'Nature & metaphor',
    icons: [
      {
        id: 'seedling', label: 'New growth',
        paths: [
          'M12 21v-6.5',
          'M12 14.5C12 10.9 9.4 8.5 6 8.5c-.3 3.7 2.4 6 6 6z',
          'M12 12.5c0-2.9 2.1-5 5.4-5 .2 3-2.1 5.2-5.4 5z',
        ],
      },
      {
        id: 'tree', label: 'Long-term',
        paths: [
          'M12 3.5c3.2 0 5.7 2.5 5.7 5.6 0 3-2.5 5.4-5.7 5.4s-5.7-2.4-5.7-5.4c0-3.1 2.5-5.6 5.7-5.6z',
          'M12 21v-10.5',
          'M12 10.5 9.8 8.3',
          'M12 12.5l2.2-2.2',
          'M8.8 21h6.4',
        ],
      },
      {
        id: 'mountain', label: 'Hard climb',
        paths: ['M3.5 19.5 9.5 8.4l4.1 7.5 2.4-4.2 4.5 7.8z'],
      },
      {
        id: 'wave', label: 'Trends',
        paths: [
          'M3 9.8c2.2 0 2.2-2.6 4.5-2.6s2.3 2.6 4.5 2.6 2.2-2.6 4.5-2.6 2.3 2.6 4.5 2.6',
          'M3 16.4c2.2 0 2.2-2.6 4.5-2.6s2.3 2.6 4.5 2.6 2.2-2.6 4.5-2.6 2.3 2.6 4.5 2.6',
        ],
      },
      {
        id: 'butterfly', label: 'Sensitivity',
        paths: [
          'M12 7.5v9.5',
          'M12 7.5 10.2 4.8',
          'M12 7.5l1.8-2.7',
          'M11.4 10.6C10 7.9 7.2 6.7 4.9 7.6c-1 2.8.4 5.5 3.2 6.1z',
          'M12.6 10.6c1.4-2.7 4.2-3.9 6.5-3 1 2.8-.4 5.5-3.2 6.1z',
          'M11.4 13.4c-2.2-.5-4.4.4-5.1 2.3.8 2.1 3.1 2.8 5.1 1.6z',
          'M12.6 13.4c2.2-.5 4.4.4 5.1 2.3-.8 2.1-3.1 2.8-5.1 1.6z',
        ],
      },
      {
        id: 'rabbit', label: 'Rabbit hole',
        circles: [[12, 14.6, 4.9]],
        paths: [
          'M9.4 10.2C7.9 5 9.3 2.9 10.3 3c1 .1 1.7 3.2 1.2 6.6',
          'M14.6 10.2C16.1 5 14.7 2.9 13.7 3c-1 .1-1.7 3.2-1.2 6.6',
          'M12 16.1v1.3',
          'M11.2 16.1h1.6',
        ],
        dots: [[10.1, 13.9], [13.9, 13.9]],
      },
      {
        id: 'turtle', label: 'Slow & steady',
        circles: [[19.9, 12.9, 1.5]],
        paths: [
          'M5.6 13.6a6.4 6.4 0 0 1 12.8 0',
          'M4 13.6h14.4',
          'M8 13.6l-.9 2.7',
          'M15.5 13.6l.9 2.7',
          'M9.4 8.6l-.6 5',
          'M14.6 8.6l.6 5',
        ],
      },
      {
        id: 'owl', label: 'Night wisdom',
        circles: [[9.9, 9.8, 1.9], [14.1, 9.8, 1.9]],
        paths: [
          'M17.1 13.8a5.1 5.1 0 0 1-10.2 0V6.1c0-1.6.9-2 1.9-1.1l1 .9a6 6 0 0 1 4.4 0l1-.9c1-.9 1.9-.5 1.9 1.1z',
          'm11.2 12.4.8 1.1.8-1.1',
          'M10 18.9v2',
          'M14 18.9v2',
        ],
        dots: [[9.9, 9.8], [14.1, 9.8]],
      },
      {
        id: 'blackhole', label: 'Attractor',
        discs: [[12, 12, 2.9]],
        ellipses: [[12, 12, 8.6, 3.1]],
      },
    ],
  },
  {
    title: 'Exploration',
    icons: [
      {
        id: 'compass', label: 'Strategy',
        circles: [[12, 12, 8.7]],
        paths: ['m15.5 8.5-1.8 4.7-4.7 1.8 1.8-4.7z'],
      },
      {
        id: 'globe', label: 'World',
        circles: [[12, 12, 8.7]],
        ellipses: [[12, 12, 3.9, 8.7]],
        paths: ['M3.9 9.3h16.2', 'M3.9 14.7h16.2'],
      },
      {
        id: 'map', label: 'Territory',
        paths: [
          'M9 4.5 3.5 6.6v12.9L9 17.4l6 2.1 5.5-2.1V4.5L15 6.6 9 4.5z',
          'M9 4.5v12.9',
          'M15 6.6v12.9',
        ],
      },
      {
        id: 'signpost', label: 'Decisions',
        paths: [
          'M12 3.5v2.6',
          'M6.3 6.1h9.9L18.7 8l-2.5 1.9H6.3z',
          'M12 10v2.4',
          'M17.7 12.4H7.8L5.3 14.3l2.5 1.9h9.9z',
          'M12 16.2V21',
        ],
      },
      {
        id: 'lighthouse', label: 'Guidance',
        paths: [
          'M9.8 9.5 8.3 20.5h7.4L14.2 9.5z',
          'M9.8 9.5V7.6h4.4v1.9',
          'M9.3 7.6 12 5l2.7 2.6',
          'M7.9 6.6 4 5.2',
          'M16.1 6.6 20 5.2',
          'M9.3 14h5.4',
          'M7 20.5h10',
        ],
      },
      {
        id: 'submarine', label: 'Deep dive',
        ellipses: [[11, 14.3, 7.6, 3.3]],
        paths: [
          'M9.3 11V8.2h4.2V11',
          'M11.4 8.2V5.6h2.2',
          'M18.6 12.5 21.2 11v6.6l-2.6-1.5',
        ],
        dots: [[7.8, 14.3], [11.2, 14.3]],
      },
      {
        id: 'flashlight', label: 'Dark corners',
        paths: [
          'M16.9 5.9c0 1.8-1.8 2.1-1.8 3.9v8.9a1.6 1.6 0 0 1-1.6 1.6h-3a1.6 1.6 0 0 1-1.6-1.6V9.8c0-1.8-1.8-2.1-1.8-3.9V4.1a.8.8 0 0 1 .8-.8h8.2a.8.8 0 0 1 .8.8z',
          'M7.1 6.2h9.8',
        ],
        dots: [[12, 12.6]],
      },
      {
        id: 'campfire', label: 'Gathering',
        paths: [
          'M12 4.5c1.8 1.8 3 3.4 3 5.3a3 3 0 0 1-6 0c0-1 .4-1.9 1-2.8.3.6.7 1 1.3 1.3-.2-1.3.1-2.7.7-3.8z',
          'm5.5 20.5 13-4.2',
          'm18.5 20.5-13-4.2',
        ],
      },
    ],
  },
  {
    title: 'LessWrong',
    icons: [
      {
        id: 'paperclip', label: 'Paperclip (maximize responsibly)',
        paths: [
          'm8.7 12.9 5.3-5.3a2.4 2.4 0 0 1 3.4 3.4l-6.6 6.6a4 4 0 0 1-5.7-5.7l6.6-6.6a5.6 5.6 0 0 1 7.9 7.9l-5.3 5.3',
        ],
      },
      {
        id: 'lightcone', label: 'Light cone',
        paths: ['M4.5 3.5h15L12 12z', 'M4.5 20.5h15L12 12z'],
        dots: [[12, 12]],
      },
      {
        id: 'button', label: 'Big red button',
        paths: [
          'M7.2 15.5a4.8 4.8 0 0 1 9.6 0',
          'M4.6 15.5h14.8a1.1 1.1 0 0 1 1.1 1.1v2.3a1.1 1.1 0 0 1-1.1 1.1H4.6a1.1 1.1 0 0 1-1.1-1.1v-2.3a1.1 1.1 0 0 1 1.1-1.1z',
          'M12 6.5v-2',
          'M7.8 7.6 6.4 6.2',
          'M16.2 7.6l1.4-1.4',
        ],
      },
      {
        id: 'trolley', label: 'Trolley problem',
        circles: [[8.3, 17.3, 1.6], [15.7, 17.3, 1.6]],
        paths: [
          'M6 4.5h12a1.9 1.9 0 0 1 1.9 1.9v6.8a1.9 1.9 0 0 1-1.9 1.9H6a1.9 1.9 0 0 1-1.9-1.9V6.4A1.9 1.9 0 0 1 6 4.5z',
          'M4.1 10.2h15.8',
          'M12 4.5v5.7',
          'M3.2 20.9h17.6',
        ],
      },
      {
        id: 'shoggoth', label: 'Shoggoth mask',
        paths: [
          'M12 4.5c2.3 0 4.4.5 6 1.4v5.3a6 6 0 0 1-12 0V5.9c1.6-.9 3.7-1.4 6-1.4z',
          'M9.7 12.2c.6.7 1.4 1 2.3 1s1.7-.3 2.3-1',
          'M8.4 16.6c-.2 1.9-1.5 3.3-3.6 3.9',
          'M15.6 16.6c.2 1.9 1.5 3.3 3.6 3.9',
          'M12 17.3c0 1.4-.4 2.4-1.2 3.2',
        ],
        dots: [[9.6, 9.3], [14.4, 9.3]],
      },
      {
        id: 'offswitch', label: 'Off-switch',
        paths: ['M12 3.5v8', 'M7.5 6.2a7.9 7.9 0 1 0 9 0'],
      },
      {
        id: 'distribution', label: 'Distribution',
        paths: ['M3.5 19.5h17', 'M4.5 19.5c3.6 0 3.4-11 7.5-11s3.9 11 7.5 11'],
      },
      {
        id: 'infohazard', label: 'Infohazard',
        paths: [
          'M10.4 4.5 2.9 17.4a1.85 1.85 0 0 0 1.6 2.8h15a1.85 1.85 0 0 0 1.6-2.8L13.6 4.5a1.85 1.85 0 0 0-3.2 0z',
          'M8.6 14.2c.9-1.2 2-1.8 3.4-1.8s2.5.6 3.4 1.8c-.9 1.2-2 1.8-3.4 1.8s-2.5-.6-3.4-1.8z',
        ],
        dots: [[12, 14.2]],
      },
      {
        id: 'basilisk', label: 'Basilisk',
        circles: [[16.5, 13, 1.4]],
        paths: [
          'M12 20.7a7.7 7.7 0 1 1 7.7-7.7c0 .4 0 .8-.1 1.2',
          'M12 16.9a3.9 3.9 0 1 1 3.1-1.5',
          'm17.9 13 2 1.1',
          'm17.9 13 2.2-.6',
        ],
      },
    ],
  },
];

export const RESEARCH_ICON_LIST: ResearchIconDef[] = RESEARCH_ICON_GROUPS.flatMap((g) => g.icons);

const iconsById = new Map(RESEARCH_ICON_LIST.map((def) => [def.id, def]));

/** Resolve a stored `svg:<id>` icon value to its definition, or null. */
export function getResearchIconDef(icon: string): ResearchIconDef | null {
  if (!icon.startsWith(RESEARCH_SVG_ICON_PREFIX)) return null;
  return iconsById.get(icon.slice(RESEARCH_SVG_ICON_PREFIX.length)) ?? null;
}

const DOT_RADIUS = 1.15;

/** One icon from the set, sized to 1em like an inline glyph. */
export const ResearchCustomIcon = ({ def, className }: {
  def: ResearchIconDef;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {def.paths?.map((d, i) => <path key={i} d={d} />)}
    {def.circles?.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} />)}
    {def.ellipses?.map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)}
    {def.discs?.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />)}
    {def.dots?.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={DOT_RADIUS} fill="currentColor" stroke="none" />)}
  </svg>
);

/**
 * Render a stored icon value: an `svg:<id>` set icon, or a bare Unicode emoji
 * (legacy values from the retired emoji picker keep rendering).
 * Unknown `svg:` ids fall back to nothing (callers show their default glyph
 * by only calling this when `icon` is set — pass the fallback there).
 */
export const ResearchItemIcon = ({ icon, emojiClassName, svgClassName }: {
  icon: string;
  emojiClassName?: string;
  svgClassName?: string;
}) => {
  const def = getResearchIconDef(icon);
  if (def) return <ResearchCustomIcon def={def} className={svgClassName} />;
  if (icon.startsWith(RESEARCH_SVG_ICON_PREFIX)) return null;
  return <span className={emojiClassName}>{icon}</span>;
};
