// Import to add MUI components to our component registry.
//
// This is done purely for the side effect of adding their styles
// to the allStyles.css sheet generated from registered components,
// overriding default styles.
//
// This is desirable because it will be easier to support light/dark mode
// with allStyles.css -- see note in server/.../renderPage.tsx.
//
// The `styles` callbacks should return the subsets of built-in styles which
// reference the theme's palette. A utility ./scripts/gen-mui-registration.sh
// is provided to help generate these. Example usage:
//
//   echo 'Paper Button' | bash ./scripts/gen-mui-registration.sh
//
// The script uses the material-ui source to get the original styles,
// which aren't accessible at runtime. It assumes that you have
// https://github.com/mui/material-ui checked out at branch v3.x and
// `kak`, the kakoune text editor (used for string processing), somewhere
// on your PATH.
//
// The script is a super hacky regex-based thing and you should double
// check it's output.
//
// Also, I wouldn't run it with untrusted input.
//
// In the event it doesn't work, you can manually copy and paste the styles from
// the MUI source.

// TODO: Add registerStyles() to register styles without the component.
import { registerComponent } from '../../lib/vulcan-lib/components';
import { fade, Paper, Button, ListItem, ListItemIcon } from "@/components/mui-replacement";

// Some of these baddies won't do well with our themePalette test situation,
// which involves passing "fakecolor" colors in the theme. This would case
// `fade` to throw, for example.
export const themePaletteTestExcludedComponents = ["MuiButton"]

registerComponent("MuiPaper", Paper, {
  styles: (theme: ThemeType) => {
    return {
      root: {
        backgroundColor: theme.palette.background.paper,
      },
    };
  },
  stylePriority: -10,
});

registerComponent("MuiButton", Button, {
  styles: (theme: AnyBecauseTodo) => ({
    root: {
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: fade(theme.palette.text.primary, theme.palette.action.hoverOpacity),
      },
      '&$disabled': {
        color: theme.palette.action.disabled,
      },
    },
    textPrimary: {
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: fade(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      },
    },
    textSecondary: {
      color: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: fade(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
      },
    },
    outlined: {
      border: `1px solid ${
        theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'
      }`,
      '&$disabled': {
        border: `1px solid ${theme.palette.action.disabled}`,
      },
    },
    outlinedPrimary: {
      color: theme.palette.primary.main,
      border: `1px solid ${fade(theme.palette.primary.main, 0.5)}`,
      '&:hover': {
        border: `1px solid ${theme.palette.primary.main}`,
        backgroundColor: fade(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      },
    },
    outlinedSecondary: {
      color: theme.palette.secondary.main,
      border: `1px solid ${fade(theme.palette.secondary.main, 0.5)}`,
      '&:hover': {
        border: `1px solid ${theme.palette.secondary.main}`,
        backgroundColor: fade(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
      },
      '&$disabled': {
        border: `1px solid ${theme.palette.action.disabled}`,
      },
    },
    contained: {
      color: theme.palette.getContrastText(theme.palette.grey[300]),
      backgroundColor: theme.palette.grey[300],
      '&$disabled': {
        color: theme.palette.action.disabled,
        backgroundColor: theme.palette.action.disabledBackground,
      },
      '&:hover': {
        backgroundColor: theme.palette.grey.A100,
        '@media (hover: none)': {
          backgroundColor: theme.palette.grey[300],
        },
        '&$disabled': {
          backgroundColor: theme.palette.action.disabledBackground,
        },
      },
    },
    containedPrimary: {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        '@media (hover: none)': {
          backgroundColor: theme.palette.primary.main,
        },
      },
    },
    containedSecondary: {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
        '@media (hover: none)': {
          backgroundColor: theme.palette.secondary.main,
        },
      },
    },
  }),
  stylePriority: -10,
});

registerComponent("MuiListItem", ListItem, {
  styles: (theme: AnyBecauseTodo) => ({
    root: {
      '&$selected, &$selected:hover, &$selected:focus': {
        backgroundColor: theme.palette.action.selected,
      },
    },
    divider: {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    button: {
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:focus': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  }),
  stylePriority: -10,
});

registerComponent("MuiListItemIcon", ListItemIcon, {
  styles: (theme: AnyBecauseTodo) => ({
    root: {
      color: theme.palette.action.active,
    },
  }),
  stylePriority: -10,
});
