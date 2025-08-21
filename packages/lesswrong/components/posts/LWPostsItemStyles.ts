// Shared styles for LWPostsItem and LWPlaceholderPostsItem
// Extracted to avoid circular dependency initialization issues

export const KARMA_WIDTH = 32;

// Note: This exports only the minimal styles needed by LWPlaceholderPostsItem
// to avoid importing the full LWPostsItem with all its dependencies
export const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  root: {
    position: "relative",
    minWidth: 0,
  },
  background: {
    width: "100%",
    background: theme.palette.panelBackground.default,
  },
  postsItem: {
    display: "flex",
    position: "relative",
    padding: 10,
    paddingLeft: 6,
    alignItems: "center",
    flexWrap: "nowrap",
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  title: {
    minHeight: 26,
  },
  mobileSecondRowSpacer: {
    marginTop: 6,
    minHeight: 22,
  },
});
