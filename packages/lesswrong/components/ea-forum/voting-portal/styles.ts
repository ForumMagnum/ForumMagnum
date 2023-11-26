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
    padding: "24px 24px 48px 24px",
    margin: "0 auto",
    maxWidth: 800,
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
  },
  h1: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-1.2px",
    textAlign: "center",
    color: theme.palette.givingPortal[1000],
  },
  h2: {
    fontSize: 40,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-1.2px",
    color: theme.palette.givingPortal[1000],
    marginBottom: 15,
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
  footer: {
    display: "flex",
    marginTop: "auto",
    justifyContent: "center",
    backgroundColor: theme.palette.givingPortal[200],
  },
  footerInner: {
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    maxWidth: 1000,
    width: "100%",
    gap: "32px",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      gap: "20px",
      padding: "20px 24px",
    },
  },
  footerTopRow: {
    display: "flex",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    fontWeight: 600,
    fontSize: 16,
    color: theme.palette.givingPortal[1000],
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
