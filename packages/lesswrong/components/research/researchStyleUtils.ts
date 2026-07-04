import { safeForDarkMode } from '../hooks/defineStyles';

export const researchMono = 'var(--font-geist-mono, "source-code-pro"), ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

export const researchChatSans = 'var(--font-geist-sans, "freight-sans-pro"), GreekFallback, Calibri, "Gill Sans", "Gill Sans MT", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const researchUiSans = 'var(--font-geist-sans, "freight-sans-pro"), GreekFallback, Calibri, "Gill Sans", "Gill Sans MT", "Helvetica Neue", Helvetica, Arial, sans-serif';

export function researchWarmAlpha(alpha: number): string {
  return `light-dark(rgba(68, 52, 36, ${alpha}), rgba(246, 238, 226, ${alpha}))`;
}

export function researchCanvas(_theme: ThemeType): string {
  return 'light-dark(#FAF6EE, #23201A)';
}

export function researchChatSurface(_theme: ThemeType): string {
  return 'light-dark(#FDFBF7, #2A2722)';
}

export const researchRadius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  pill: 999,
} as const;

export const researchSquircle = {
  cornerShape: 'squircle',
} as const;

export function researchInputBackground(_theme: ThemeType): string {
  return 'light-dark(#FFFFFF, #302D27)';
}

export const researchEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const researchTransition = `120ms ${researchEasing}`;

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

export function researchCard(theme: ThemeType) {
  return {
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.08)}`,
    borderRadius: researchRadius.lg,
    ...researchSquircle,
    boxShadow: `0 1px 2px ${researchWarmAlpha(0.04)}`,
  };
}

export function researchAccentTint(alpha: number) {
  return safeForDarkMode(`rgba(95, 155, 101, ${alpha})`);
}

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

export function researchCompactRowActive(theme: ThemeType) {
  return {
    background: researchWarmAlpha(0.07),
    '&:hover': {
      background: researchWarmAlpha(0.09),
    },
  };
}

export function researchResizeHandle(theme: ThemeType) {
  return {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 9,
    cursor: 'col-resize',
    zIndex: 2,
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

export function researchResizeHandleActive(theme: ThemeType) {
  return {
    '&:after': {
      background: `${theme.palette.primary.main} !important`,
    },
  };
}
