import { defineStyles } from "@/components/hooks/useStyles";

export const profileStyles = defineStyles("ProfilePage", (theme: ThemeType) => ({
  profileActionIconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    background: "none",
    color: "light-dark(#000, #fff)",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.67,
    },
    "&:focus-visible": {
      outline: `1px solid light-dark(#000, #fff)`,
      outlineOffset: 2,
      borderRadius: 2,
    },
  },
  profileActionIcon: {
    fontSize: 16,
  },
  sunshineToolsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  emptyStateContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: "16px 0 32px",
    textAlign: "left",
    width: "100%",
  },
  emptyStateImage: {
    marginTop: 8,
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
    "& img": {
      width: "100%",
      height: "auto",
      opacity: 0.85,
      display: "block",
      filter: "none",
      mixBlendMode: theme.dark ? "normal" : "multiply",
    },
  },
  emptyStateDescription: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    fontWeight: 400,
    color: theme.palette.text.dim,
    lineHeight: 1.5,
    margin: 0,
    fontStyle: "italic",
  },
  sortPanel: {
    background: theme.palette.greyAlpha(0.03),
    padding: "20px 24px",
    marginBottom: 20,
    borderRadius: 4,
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: "$panelOpen 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  sortPanelClosing: {
    animation: "$panelClose 0.3s cubic-bezier(0.4, 0, 1, 1)",
    animationFillMode: "forwards",
  },
  sortPanelMulti: {
    display: "flex",
    gap: 40,
  },
  sortPanelSection: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  sortPanelHeader: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 600,
    fontStyle: "italic",
    color: theme.palette.text.dim,
    marginBottom: 6,
  },
  sortPanelOption: {
    display: "block",
    width: "fit-content",
    padding: "4px 0 4px 16px",
    textAlign: "left",
    background: "none",
    border: "none",
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.text.dim40,
    cursor: "pointer",
    transition: "color 0.15s ease",
    "&:hover": {
      color: theme.palette.text.normal,
    },
  },
  sortPanelOptionSelected: {
    color: theme.palette.text.normal,
  },
  articleLink: {
    textDecoration: "none",
    color: "inherit",
    display: "contents",
  },
  profileFeedTopMargin: {
    marginTop: 16,
  },
  sidebarAuthorMeta: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "2px 10px",
    marginTop: 6,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    color: theme.palette.text.dim,
    fontSize: 12,
    lineHeight: 1.4,
  },
  sidebarMetaAction: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 400,
    textDecoration: "none",
    "&:hover": {
      opacity: 0.67,
    },
  },
  postsSidebarHasBio: {
    "& $sidebarStats": {
      display: "none",
    },
  },
  sidebarAuthorBio: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.text.dim55,
    fontWeight: 400,
    margin: 0,
  },
  sidebarAuthorBioContent: {
    // Normalize typography across all rendered block types in bio HTML.
    "& p, & ul, & ol, & li, & blockquote, & pre, & h1, & h2, & h3, & h4, & h5, & h6, & table, & th, & td": {
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      lineHeight: 1.6,
      color: theme.palette.text.dim55,
      fontWeight: 400,
    },
    "& p": {
      marginTop: 0,
      marginBottom: 12,
    },
    "& p:last-child": {
      marginBottom: 0,
    },
    "& ul, & ol": {
      marginTop: 0,
      marginBottom: 12,
      paddingLeft: 20,
    },
    "& li": {
      marginBottom: 4,
    },
    "& li:last-child": {
      marginBottom: 0,
    },
  },
  sidebarStats: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.text.dim,
    fontWeight: 400,
    marginTop: 16,
  },
  sidebarStatRow: {
    whiteSpace: "nowrap",
  },
  diamondHollow: {
    backgroundColor: theme.palette.primary.main,
    position: "relative" as const,
    "&::after": {
      content: '""',
      position: "absolute",
      top: 1.5,
      left: 1.5,
      right: 1.5,
      bottom: 1.5,
      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
      backgroundColor: theme.palette.background.profilePageBackground,
    },
  },
  readMore: {
    textAlign: "left",
    marginTop: 12,
  },
  readMoreLink: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.primary.main,
    textDecoration: "none",
    fontWeight: 400,
    "&:hover": {
      opacity: 0.67,
    },
  },
  sidebarActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 22,
  },
  sidebarSubscribe: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-block",
    fontWeight: 400,
    "&:hover": {
      opacity: 0.67,
    },
  },
  sidebarMore: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-block",
    fontWeight: 400,
    textDecoration: "none",
    "&:hover": {
      opacity: 0.67,
    },
  },
  "@keyframes slideIn": {
    from: {
      opacity: 0,
      transform: "translateY(10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
  "@keyframes panelOpen": {
    from: {
      opacity: 0,
      maxHeight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginBottom: 0,
    },
    to: {
      opacity: 1,
      maxHeight: 500,
      paddingTop: 20,
      paddingBottom: 20,
      marginBottom: 20,
    },
  },
  "@keyframes panelClose": {
    from: {
      opacity: 1,
      maxHeight: 500,
      paddingTop: 20,
      paddingBottom: 20,
      marginBottom: 20,
    },
    to: {
      opacity: 0,
      maxHeight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginBottom: 0,
    },
  },
}));
