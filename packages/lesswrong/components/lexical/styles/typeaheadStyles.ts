import { ThemeType } from '@/themes/themeType';

/**
 * Typeahead popover container styles
 */
export const typeaheadPopover = (theme: ThemeType) => ({
  background: theme.palette.grey[0],
  boxShadow: `0px 5px 10px ${theme.palette.greyAlpha(0.3)}`,
  borderRadius: 8,
  position: 'relative' as const,
});

/**
 * Typeahead popover list styles
 */
export const typeaheadList = (theme: ThemeType) => ({
  padding: 0,
  listStyle: 'none',
  margin: 0,
  borderRadius: 8,
  maxHeight: 200,
  overflowY: 'scroll' as const,
  // Hide scrollbar
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  msOverflowStyle: 'none' as const,
  scrollbarWidth: 'none' as const,
});

/**
 * Typeahead popover list item styles (for ul li)
 */
export const typeaheadListItem = (theme: ThemeType) => ({
  margin: 0,
  minWidth: 180,
  fontSize: 14,
  outline: 'none',
  cursor: 'pointer',
  borderRadius: 8,
  '&.selected': {
    background: theme.palette.grey[200],
  },
});

/**
 * Typeahead popover item styles (for direct li)
 */
export const typeaheadItem = (theme: ThemeType) => ({
  margin: 0, //'0 8px',
  padding: 8,
  color: theme.palette.grey[1000],
  cursor: 'pointer',
  lineHeight: '16px',
  fontSize: 15,
  display: 'flex',
  alignContent: 'center',
  flexDirection: 'row' as const,
  flexShrink: 0,
  backgroundColor: theme.palette.grey[0],
  borderRadius: 8,
  border: 0,
  '&:first-child': {
    borderRadius: '8px 8px 0 0',
  },
  '&:last-child': {
    borderRadius: '0 0 8px 8px',
  },
  '&:hover': {
    backgroundColor: theme.palette.grey[200],
  },
});

/**
 * Typeahead active state
 */
export const typeaheadItemActive = () => ({
  display: 'flex',
  width: 20,
  height: 20,
  backgroundSize: 'contain',
});

/**
 * Typeahead item text
 */
export const typeaheadItemText = () => ({
  display: 'flex',
  lineHeight: '20px',
  flexGrow: 1,
  minWidth: 150,
});

/**
 * Typeahead item icon
 */
export const typeaheadItemIcon = () => ({
  display: 'flex',
  width: 20,
  height: 20,
  userSelect: 'none' as const,
  marginRight: 8,
  lineHeight: '16px',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
});

/**
 * Component picker menu specific width
 */
export const componentPickerMenu = () => ({
  width: 200,
});

