/**
 * Shared toolbar styles for Lexical editor components.
 * Import and spread these into defineStyles calls.
 */

/**
 * Base toolbar item button styles
 */
export const toolbarItem = (theme: ThemeType) => ({
  border: 0,
  display: 'flex',
  background: 'none',
  borderRadius: 10,
  padding: 8,
  cursor: 'pointer',
  verticalAlign: 'middle',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:disabled': {
    cursor: 'not-allowed',
  },
  '&:hover:not(:disabled)': {
    backgroundColor: theme.palette.grey[200],
  },
  '&:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
  },
});

/**
 * Spaced toolbar item (adds right margin)
 */
export const toolbarItemSpaced = () => ({
  marginRight: 2,
});

/**
 * Active toolbar item state
 */
export const toolbarItemActive = (theme: ThemeType) => ({
  backgroundColor: theme.palette.greyAlpha(0.1),
  '& i': {
    opacity: 1,
  },
});

/**
 * Toolbar item text label
 */
export const toolbarItemText = (theme: ThemeType) => ({
  display: 'flex',
  lineHeight: '20px',
  verticalAlign: 'middle',
  fontSize: 14,
  color: theme.palette.grey[600],
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  height: 20,
  textAlign: 'left' as const,
  paddingRight: 10,
});

/**
 * Toolbar item icon container
 */
export const toolbarItemIcon = () => ({
  display: 'flex',
  width: 20,
  height: 20,
  userSelect: 'none' as const,
  marginRight: 8,
  lineHeight: '16px',
  backgroundSize: 'contain',
});

/**
 * Format icon (for bold, italic, etc.)
 */
export const formatIcon = () => ({
  display: 'flex',
  width: 18,
  height: 18,
  opacity: 0.6,
  verticalAlign: '-0.25em',
});

/**
 * Disabled state for toolbar item children
 */
export const toolbarItemDisabledChildren = () => ({
  opacity: 0.2,
});

/**
 * Toolbar divider
 */
export const toolbarDivider = (theme: ThemeType) => ({
  width: 1,
  backgroundColor: theme.palette.grey[200],
  margin: '0 4px',
});

/**
 * Main toolbar container
 */
export const toolbar = (theme: ThemeType) => ({
  display: 'flex',
  marginBottom: 1,
  background: theme.palette.background.pageActiveAreaBackground,
  padding: 4,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  verticalAlign: 'middle',
  overflow: 'auto',
  height: 36,
  position: 'sticky' as const,
  top: 0,
  zIndex: 2,
  overflowY: 'hidden' as const,
});

/**
 * Code language dropdown width
 */
export const codeLanguage = () => ({
  width: 150,
});

/**
 * Chevron down icon in toolbar/dropdown
 */
export const chevronDown = () => ({
  marginTop: 3,
  width: 16,
  height: 16,
  display: 'flex',
  userSelect: 'none' as const,
});

/**
 * Chevron down inside (for nested dropdowns)
 */
export const chevronDownInside = () => ({
  width: 16,
  height: 16,
  display: 'flex',
  marginLeft: -25,
  marginTop: 11,
  marginRight: 10,
  pointerEvents: 'none' as const,
});

/**
 * Block controls container
 */
export const blockControls = () => ({
  display: 'flex',
  alignItems: 'center',
});

/**
 * Block controls dropdown button text
 */
export const blockControlsDropdownText = () => ({
  width: '7em',
  textAlign: 'left' as const,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  display: 'inline-block',
});
