import { postBodyStyles } from '../../themes/stylePiping';

export const descriptionStyles = (theme: ThemeType) => ({
  ...postBodyStyles(theme),
  ...theme.typography.body2,
  lineHeight: '1.65rem',
  '& p': {
    marginTop: '.5em',
    marginBottom: '.5em',
    '&:first-child': {
      marginTop: 0,
    },
    'style~&': {
      marginTop: 0,
    },
    '&:last-child': {
      marginBottom: 0,
    },
  },
});
