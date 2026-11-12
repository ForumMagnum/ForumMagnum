// Button styles shared by the sequence editor's bottom bar and description
// editor, following the post editor's bottom bar (MobileEditorBottomBar).

function baseButtonStyles(theme: ThemeType) {
  return {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    "&:disabled": {
      opacity: 0.45,
      cursor: "default",
    },
  };
}

export function primaryEditorButtonStyles(theme: ThemeType) {
  return {
    ...baseButtonStyles(theme),
    background: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    border: "none",
    "&:hover:enabled": {
      background: theme.palette.primary.dark,
    },
  };
}

export function secondaryEditorButtonStyles(theme: ThemeType) {
  return {
    ...baseButtonStyles(theme),
    background: "none",
    border: theme.palette.greyBorder("1px", 0.14),
    color: theme.palette.greyAlpha(0.68),
    "&:hover:enabled": {
      background: theme.palette.greyAlpha(0.04),
    },
  };
}
