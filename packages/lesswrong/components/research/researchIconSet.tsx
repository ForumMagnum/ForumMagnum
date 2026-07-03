import React from 'react';

/**
 * The hand-drawn monochrome icon set offered in the research emoji picker's
 * "Icons" section, as an alternative to full-color Unicode emoji. Drawn on a
 * 24px grid with a 1.6px stroke (matching the line weight of the sidebar's
 * Lucide-style glyphs), stroked in currentColor so they pick up the warm grey
 * text tones and invert in dark mode.
 *
 * Selections are stored in the existing `icon` text field as `svg:<id>`
 * (plain Unicode emoji are stored as the bare character); render either kind
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
  /** Small filled dots (pips, pupils, points): [cx, cy]. */
  dots?: Array<readonly [number, number]>;
}

export const RESEARCH_ICON_LIST: ResearchIconDef[] = [
  // ---- Research & thinking ----
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

  // ---- Writing & documents ----
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

  // ---- Code & systems ----
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

  // ---- Data & math ----
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

  // ---- AI & agents ----
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
  {
    id: 'chip', label: 'Compute',
    paths: [
      'M8.6 7.5h6.8a1.1 1.1 0 0 1 1.1 1.1v6.8a1.1 1.1 0 0 1-1.1 1.1H8.6a1.1 1.1 0 0 1-1.1-1.1V8.6a1.1 1.1 0 0 1 1.1-1.1z',
      'M10.8 10.8h2.4v2.4h-2.4z',
      'M9.5 7.5V4.8', 'M14.5 7.5V4.8', 'M9.5 19.2v-2.7', 'M14.5 19.2v-2.7',
      'M7.5 9.5H4.8', 'M7.5 14.5H4.8', 'M19.2 9.5h-2.7', 'M19.2 14.5h-2.7',
    ],
  },

  // ---- Planning & organization ----
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
    id: 'compass', label: 'Strategy',
    circles: [[12, 12, 8.7]],
    paths: ['m15.5 8.5-1.8 4.7-4.7 1.8 1.8-4.7z'],
  },
  {
    id: 'flag', label: 'Milestone',
    paths: [
      'M6 21V3.8',
      'M6 4.6c1.9-1.2 3.9-1.2 6 0s4.1 1.2 6 0v8.6c-1.9 1.2-3.9 1.2-6 0s-4.1-1.2-6 0z',
    ],
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

  // ---- Communication & misc ----
  {
    id: 'chat', label: 'Discussion',
    paths: ['M20 13.7a2.3 2.3 0 0 1-2.3 2.3H9.6L4 20.3V6.8a2.3 2.3 0 0 1 2.3-2.3h11.4A2.3 2.3 0 0 1 20 6.8z'],
  },
  {
    id: 'globe', label: 'World',
    circles: [[12, 12, 8.7]],
    ellipses: [[12, 12, 3.9, 8.7]],
    paths: ['M3.9 9.3h16.2', 'M3.9 14.7h16.2'],
  },
  {
    id: 'key', label: 'Secrets',
    circles: [[8, 16, 3.6]],
    paths: ['m10.6 13.4 8.9-8.9', 'M16.4 7.6l2.4 2.4', 'M13.4 10.6l1.9 1.9'],
  },
  {
    id: 'rocket', label: 'Launch',
    circles: [[12, 10.3, 1.7]],
    paths: [
      'M12 3.1c2.9 1.8 4.6 5 4.6 8.8 0 1.4-.2 2.7-.6 3.9H8c-.4-1.2-.6-2.5-.6-3.9 0-3.8 1.7-7 4.6-8.8z',
      'M7.6 12.2 4.6 17.2 8 15.6z',
      'M16.4 12.2l3 5-3.4-1.6z',
      'M10.4 18.6c0 1.3.5 2.4 1.6 3.3 1.1-.9 1.6-2 1.6-3.3',
    ],
  },

  // ---- LessWrong ----
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
];

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
    {def.dots?.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={DOT_RADIUS} fill="currentColor" stroke="none" />)}
  </svg>
);

/**
 * Render a stored icon value: an `svg:<id>` set icon, or a bare Unicode emoji.
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
