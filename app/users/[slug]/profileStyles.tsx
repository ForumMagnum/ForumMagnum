import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import classNames from "classnames";

export const profileStyles = defineStyles("ProfilePage", (theme: ThemeType) => ({
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
}));

const tabPanelStyles = defineStyles("TabPanel", (theme: ThemeType) => ({
  tabPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "$slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "@media (max-width: 630px)": {
      order: 1,
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
}));

export function TabPanel({className, children}: {className?: string, children: React.ReactNode}) {
  const classes = useStyles(tabPanelStyles);
  return <div className={classNames(className, classes.tabPanel)}>
    {children}
  </div>;
}
