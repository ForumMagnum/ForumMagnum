export const votingPortalStyles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    padding: "48px 24px 48px 24px",
    margin: "0 auto",
    maxWidth: 800,
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.down("xs")]: {
      padding: "24px 24px 48px 24px",
    },
  },
  h1: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-1px",
    textAlign: "center",
    color: theme.palette.givingPortal[1000],
  },
  h2: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.5px",
    color: theme.palette.givingPortal[1000],
    marginBottom: 16,
    [theme.breakpoints.down("xs")]: {
      fontSize: 32,
    },
  },
  subtitle: {
    fontWeight: 500,
    fontSize: 16,
    lineHeight: "24px",
    marginBottom: 26,
    '& a': {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      '&:hover': {
        textDecoration: "underline",
      }
    }
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
    borderRadius: theme.borderRadius.small,
    padding: 16,
    outline: "none",
    textAlign: "center",
    color: theme.palette.givingPortal.button.light,
    backgroundColor: theme.palette.givingPortal.button.dark,
    border: `1.5px solid ${theme.palette.givingPortal.button.dark}`,
    "&:hover": {
      opacity: 0.9,
    },
    "&:active": {
      opacity: 0.8,
    },
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.65,
    "&:hover": {
      opacity: 0.65,
    },
    "&:active": {
      opacity: 0.65,
    },
  },
});
