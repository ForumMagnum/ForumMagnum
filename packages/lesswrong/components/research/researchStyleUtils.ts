/**
 * Shared design tokens and style helpers for the research surface.
 *
 * The research UI aims for an IDE feel — a marriage of VSCode, Notion and
 * Obsidian: the site header is hidden and the workspace owns the viewport;
 * chrome panels (sidebar, palette) are IDE-compact. ALL surfaces are one
 * flat bright canvas separated only by hairline borders — static grey
 * surface tints have been rejected repeatedly ("looks cheap"); never add
 * them (quiet hover/selection states are fine). A single sage-green accent
 * (the LW primary) is used sparingly for interactive / agent state. The
 * "tech" dial comes from monospace micro-labels, crisp focus rings,
 * terminal-styled metadata, and tight micro-interactions rather than from
 * loud color.
 *
 * Everything here is built from theme palette tokens (greyAlpha / text /
 * primary), which auto-invert in dark mode — so the whole surface is
 * dark-mode safe without per-color overrides.
 */
import { safeForDarkMode } from '../hooks/defineStyles';

/**
 * The research surface speaks in three typographic voices:
 *
 *  - DOCUMENTS — the LessWrong essay serif (`theme.palette.fonts.serifStack`,
 *    Warnock Pro) with ETBook display headings: durable content reads as a
 *    LessWrong essay-in-progress, not tool output.
 *  - THE AGENT — Freight Sans (`researchChatSans`): conversation prose
 *    (transcripts, composer, collapsed presentations) is warm and humanist
 *    but visibly distinct from the user's document prose.
 *  - THE MACHINERY — monospace (`researchMono`): tool calls, statuses,
 *    eyebrows, metadata.
 *
 * Workspace chrome (sidebar, palette, buttons) stays in the site sans stack.
 */

// Machine voice: Geist Mono. The variable is provided by app/research/
// layout.tsx via next/font; outside /research routes the fallback stack
// applies unchanged.
export const researchMono = 'var(--font-geist-mono, "source-code-pro"), ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

// Agent voice: Geist, matching the chrome, with Freight Sans as the
// fallback where the next/font variable isn't in scope. Documents keep the
// essay serif, so agent prose stays visibly distinct from the user's
// document prose.
export const researchChatSans = 'var(--font-geist-sans, "freight-sans-pro"), GreekFallback, Calibri, "Gill Sans", "Gill Sans MT", "Helvetica Neue", Helvetica, Arial, sans-serif';

// Chrome voice: Geist — soft, round grotesque — loaded via next/font in
// app/research/layout.tsx, falling back to the agent's humanist Freight
// Sans where the variable isn't in scope.
export const researchUiSans = 'var(--font-geist-sans, "freight-sans-pro"), GreekFallback, Calibri, "Gill Sans", "Gill Sans MT", "Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * Warm neutral replacing `theme.palette.greyAlpha` on the research surface:
 * pure black-alpha greys read cold; this is the same idea tinted toward
 * umber in light mode and cream in dark mode. Same alpha semantics as
 * greyAlpha, so call sites swap 1:1.
 */
export function researchWarmAlpha(alpha: number): string {
  return `light-dark(rgba(68, 52, 36, ${alpha}), rgba(246, 238, 226, ${alpha}))`;
}

/**
 * The research canvas: warm paper instead of pure white, uniformly across
 * every surface (sidebar, document, panels, inputs) — the flat-canvas rule
 * still holds, the whole canvas just sits a step warmer. Dark mode gets the
 * matching warm near-black.
 */
export function researchCanvas(_theme: ThemeType): string {
  return 'light-dark(#FAF6EE, #23201A)';
}

/**
 * Conversation surfaces (agent blocks, the chat panel/fullscreen transcript
 * column): a deliberate carve-out from the no-static-surface-tints rule.
 * Everything else stays on researchCanvas. Chat boxes sit LIGHTER than the
 * canvas — near-white cards floating on the warm paper, not a darker cream
 * recess — and the yellow cast stays minimal (R−B ≤ ~8; anything stronger
 * reads tinted rather than "white").
 */
export function researchChatSurface(_theme: ThemeType): string {
  return 'light-dark(#FDFBF7, #2A2722)';
}

// `xs` is for tiny icon buttons and chips that would read blobby at the
// larger radii; `lg` deliberately stops at 12 — bigger reads too rounded on
// the large boxes.
export const researchRadius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  pill: 999,
} as const;

/**
 * Squircle corner geometry: spread alongside a borderRadius. `corner-shape`
 * is supported in current Chromium; elsewhere it's ignored and corners stay
 * plainly rounded.
 */
export const researchSquircle = {
  cornerShape: 'squircle',
} as const;

/**
 * Text-entry surfaces sit a step BRIGHTER than whatever they're on — pure
 * white on the near-white chat cards and the warm canvas alike — so inputs
 * read as the lightest thing on screen rather than a darker inset.
 */
export function researchInputBackground(_theme: ThemeType): string {
  return 'light-dark(#FFFFFF, #302D27)';
}

// One easing curve for every transition so motion feels consistent.
export const researchEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const researchTransition = `120ms ${researchEasing}`;

/**
 * A thin, unobtrusive scrollbar for panels and scroll regions — reads as
 * "tool" rather than "webpage". Spread into the scroll container's class.
 */
export function researchScrollbars(theme: ThemeType) {
  return {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${researchWarmAlpha(0.18)} transparent`,
    '&::-webkit-scrollbar': {
      width: 9,
      height: 9,
    },
    '&::-webkit-scrollbar-thumb': {
      background: researchWarmAlpha(0.16),
      borderRadius: researchRadius.pill,
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
    },
    '&:hover::-webkit-scrollbar-thumb': {
      background: researchWarmAlpha(0.26),
      backgroundClip: 'padding-box',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  };
}

/** A tiny uppercase monospace section/eyebrow label. */
export function researchEyebrow(theme: ThemeType) {
  return {
    fontFamily: researchMono,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: theme.palette.text.dim,
  };
}

/** Plain text input / textarea chrome shared by the list + forms. */
export function researchTextInput(theme: ThemeType) {
  return {
    width: '100%',
    boxSizing: 'border-box' as const,
    border: `1px solid ${researchWarmAlpha(0.1)}`,
    borderRadius: researchRadius.md,
    ...researchSquircle,
    padding: '10px 13px',
    fontSize: 14,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
    background: researchInputBackground(theme),
    fontFamily: researchUiSans,
    outline: 'none',
    transition: `border-color ${researchTransition}, box-shadow ${researchTransition}, background ${researchTransition}`,
    '&:hover': {
      borderColor: researchWarmAlpha(0.2),
    },
    '&:focus': {
      // Global styles zero out input borders on focus; restate the full border
      // (plus a soft sage focus ring) or the edge disappears.
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${researchAccentTint(0.16)}`,
    },
    '&::placeholder': { color: researchWarmAlpha(0.32) },
    '&:disabled': {
      background: researchWarmAlpha(0.04),
      color: theme.palette.text.dim,
      cursor: 'not-allowed',
    },
  };
}

/**
 * Solid sage-green primary action button. `primary.main` is the same hue in
 * light + dark mode, so the contrast text stays correct in both.
 */
export function researchPrimaryButton(theme: ThemeType) {
  return {
    appearance: 'none' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: 'none',
    borderRadius: researchRadius.md,
    ...researchSquircle,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: researchUiSans,
    lineHeight: 1.2,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: `background ${researchTransition}, box-shadow ${researchTransition}, transform ${researchTransition}`,
    boxShadow: `0 1px 2px ${researchWarmAlpha(0.12)}`,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
    '&:active': {
      transform: 'translateY(0.5px)',
    },
    '&:disabled': {
      background: researchWarmAlpha(0.1),
      color: theme.palette.text.dim,
      boxShadow: 'none',
      cursor: 'not-allowed',
    },
  };
}

/** Quiet, bordered secondary button. */
export function researchGhostButton(theme: ThemeType) {
  return {
    appearance: 'none' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: `1px solid ${researchWarmAlpha(0.14)}`,
    borderRadius: researchRadius.md,
    ...researchSquircle,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: researchUiSans,
    lineHeight: 1.2,
    background: researchCanvas(theme),
    color: theme.palette.text.primary,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: `border-color ${researchTransition}, background ${researchTransition}`,
    '&:hover': {
      borderColor: researchWarmAlpha(0.24),
      background: researchWarmAlpha(0.03),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };
}

/** Card / panel surface: warm white, hairline border, soft lift. */
export function researchCard(theme: ThemeType) {
  return {
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.08)}`,
    borderRadius: researchRadius.lg,
    ...researchSquircle,
    boxShadow: `0 1px 2px ${researchWarmAlpha(0.04)}`,
  };
}

/**
 * Sage-green tint at a given alpha. The LW primary green (#5f9b65) is constant
 * across light/dark mode, so a fixed rgba reads correctly in both — wrapped in
 * `safeForDarkMode` so the dark-mode color audit accepts it.
 */
export function researchAccentTint(alpha: number) {
  return safeForDarkMode(`rgba(95, 155, 101, ${alpha})`);
}

/**
 * Compact chat-prose normalization for conversation content rendered through
 * ChunkContent / llmChat content styles inside a research document. Two
 * leakage sources need cancelling:
 *  - llmChat (commentBodyStyles) wrapper/paragraph margins, which read as
 *    random whitespace in compact rows;
 *  - the surrounding researchDocument scope's postBodyStyles, which pushes
 *    the site's big serif reading typography onto li / blockquote / heading
 *    descendants.
 * Spread into any class applied to the chunk's ContentStyles wrapper, after
 * setting that class's own fontSize/fontFamily.
 */
export function researchChatProse(_theme: ThemeType) {
  return {
    marginTop: 0,
    marginBottom: 0,
    '& p': {
      marginTop: 0,
      marginBottom: '0.55em',
    },
    '& p:last-child, & ul:last-child, & ol:last-child, & blockquote:last-child, & pre:last-child': {
      marginBottom: 0,
    },
    '& ul, & ol': {
      marginTop: 0,
      marginBottom: '0.55em',
    },
    '& li, & blockquote': {
      fontSize: 'inherit',
      lineHeight: 'inherit',
      fontFamily: 'inherit',
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontSize: '1.1em',
      lineHeight: 1.4,
      margin: '0.8em 0 0.4em',
      fontWeight: 600,
      fontFamily: 'inherit',
      color: 'inherit',
    },
  };
}

/**
 * IDE-compact interactive row (sidebar items, palette results): 13px label,
 * ~26px row height, quiet neutral hover/active. Spread into the row class and
 * add `researchCompactRowActive` states on top.
 */
export function researchCompactRow(theme: ThemeType) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    width: '100%',
    boxSizing: 'border-box' as const,
    minHeight: 26,
    padding: '3px 8px',
    border: 'none',
    borderRadius: researchRadius.sm,
    background: 'transparent',
    fontFamily: researchUiSans,
    fontSize: 13,
    lineHeight: 1.3,
    textAlign: 'left' as const,
    color: theme.palette.text.primary,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    transition: `background ${researchTransition}, color ${researchTransition}`,
    '&:hover': {
      background: researchWarmAlpha(0.05),
    },
  };
}

/** Active/selected state to layer over `researchCompactRow`. */
export function researchCompactRowActive(theme: ThemeType) {
  return {
    background: researchWarmAlpha(0.07),
    '&:hover': {
      background: researchWarmAlpha(0.09),
    },
  };
}

/**
 * Invisible-until-hovered drag handle for resizable panels. Position it
 * absolutely along the panel edge; the visible line fades in on hover/drag
 * (add `researchResizeHandleActive` while dragging).
 */
export function researchResizeHandle(theme: ThemeType) {
  return {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 9,
    cursor: 'col-resize',
    zIndex: 2,
    // The visible 1px line, centered in the 9px hit area
    '&:after': {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      left: 4,
      width: 1,
      background: 'transparent',
      transition: `background ${researchTransition}`,
    },
    '&:hover:after': {
      background: researchWarmAlpha(0.2),
    },
  };
}

/** Stronger line while a drag is in progress. */
export function researchResizeHandleActive(theme: ThemeType) {
  return {
    '&:after': {
      background: `${theme.palette.primary.main} !important`,
    },
  };
}
