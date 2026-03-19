export const submitButtonStyles = (theme: ThemeType) => ({
  fontFamily: theme.typography.fontFamily,
  marginLeft: "5px",
  paddingBottom: 2,
  fontSize: 16,
  color: theme.palette.secondary.main,
  "&:hover": {
    background: theme.palette.panelBackground.darken05,
  },
});

export const cancelButtonStyles = (theme: ThemeType) => ({
  color: theme.palette.text.dim40,
  fontFamily: theme.typography.fontFamily,
  marginLeft: "5px",
  "&:hover": {
    background: theme.palette.panelBackground.darken05,
  },
  paddingBottom: 2,
  fontSize: 16,
});
