export const votingPortalStyles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    backgroundColor: theme.palette.givingPortal[0],
    minHeight: "100%",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    maxWidth: 1252,
    padding: 40,
    margin: "0 auto",
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
});
