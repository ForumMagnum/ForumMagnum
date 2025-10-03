import { defineStyles } from "../hooks/useStyles"

// Shared between post- and comment editors
export const ckEditorPluginStyles = defineStyles("CKEditor", (theme: ThemeType) => ({
  ckWrapper: {
    // Theme values exported for use in CkEditor-specific stylesheets
    "--palette-panelBackground-default": theme.palette.panelBackground.default,
    "--palette-fonts-sansSerifStack": theme.palette.fonts.sansSerifStack,
    "--palette-grey-200": theme.palette.grey[200],
    "--palette-grey-300": theme.palette.grey[300],
    "--palette-grey-600": theme.palette.grey[600],
    "--palette-grey-1000": theme.palette.grey[1000],
    "--palette-error-main": theme.palette.error.main,
    "--borderRadius-defaul": theme.borderRadius.default,
  },
  sidebar: {
    position: 'absolute',
    right: -350,
    width: 300,
    [theme.breakpoints.down('md')]: {
      position: 'absolute',
      right: -100,
      width: 50
    },
    [theme.breakpoints.down('sm')]: {
      right: 0
    }
  },
  addMessageButton: {
    marginBottom: 30,
  },
  hidden: {
    display: "none",
  },
}))
