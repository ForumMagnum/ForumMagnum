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
 * Format icon (for bold, italic, etc.)
 */
export const formatIcon = () => ({
  display: 'flex',
  width: 18,
  height: 18,
  opacity: 0.6,
  verticalAlign: '-0.25em',
});

