export const votingPortalStyles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    minHeight: "100%",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    padding: 40,
    margin: "0 auto",
    maxWidth: 800,
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.down("md")]: {
      padding: 24,
    },
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
    marginBottom: 15
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
  }
});
