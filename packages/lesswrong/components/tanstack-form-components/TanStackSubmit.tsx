import { isFriendlyUI } from '../../themes/forumTheme';

export const submitButtonStyles = (theme: ThemeType) => ({
  fontFamily: theme.typography.fontFamily,
  marginLeft: "5px",
  ...(isFriendlyUI
    ? {
      fontSize: 14,
      fontWeight: 500,
      textTransform: "none",
      background: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite, // Dark mode independent
      "&:hover": {
        background: theme.palette.primary.dark,
      },
    }
    : {
      paddingBottom: 2,
      fontSize: 16,
      color: theme.palette.secondary.main,
      "&:hover": {
        background: theme.palette.panelBackground.darken05,
      },
    }),
});

export const cancelButtonStyles = (theme: ThemeType) => ({
  color: theme.palette.text.dim40,
  fontFamily: theme.typography.fontFamily,
  marginLeft: "5px",
  "&:hover": {
    background: theme.palette.panelBackground.darken05,
  },
  ...(isFriendlyUI
    ? {
      fontSize: 14,
      fontWeight: 500,
      textTransform: "none",
    }
    : {
      paddingBottom: 2,
      fontSize: 16,
    }),
});
