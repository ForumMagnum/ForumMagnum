/**
 * As part of our static CSS generation, we need to get the styles for all of
 * the MaterialUI components that we use.
 *
 * When adding a new component below, be sure to prepend it's name with 'Mui',
 * and import the _file_ where the component is defined, not just the directory
 * (ie; "@/lib/vendor/@material-ui/core/src/Badge/Badge" instead of "@/lib/vendor/@material-ui/core/src/Badge").
 *
 * Some components also have a 'Base' variant that must be included here too
 * even if they're only used indirectly (eg; InputBase, ButtonBase). Failing to
 * do this will result in the wrong theme being used during SSR - it will be
 * fixed during JS hydration, but you'll get an ugly flash of the wrong theme.
 *
 * TODO: There's probably some way to do this automatically?
 */
const getUsedMuiStyles = () => {
  const components = {
    MuiBadge: require("@/lib/vendor/@material-ui/core/src/Badge/Badge").styles,
    MuiButtonBase: require("@/lib/vendor/@material-ui/core/src/ButtonBase/ButtonBase").styles,
    MuiButton: require("@/lib/vendor/@material-ui/core/src/Button/Button").styles,
    MuiCard: require("@/lib/vendor/@material-ui/core/src/Card/Card").styles,
    MuiCardContent: require("@/lib/vendor/@material-ui/core/src/CardContent/CardContent").styles,
    MuiCheckbox: require("@/lib/vendor/@material-ui/core/src/Checkbox/Checkbox").styles,
    MuiChip: require("@/lib/vendor/@material-ui/core/src/Chip/Chip").styles,
    MuiClickAwayListener: require("@/lib/vendor/@material-ui/core/src/ClickAwayListener/ClickAwayListener").styles,
    MuiDialog: require("@/lib/vendor/@material-ui/core/src/Dialog/Dialog").styles,
    MuiDivider: require("@/lib/vendor/@material-ui/core/src/Divider/Divider").styles,
    MuiDrawer: require("@/lib/vendor/@material-ui/core/src/Drawer/Drawer").styles,
    MuiFormControl: require("@/lib/vendor/@material-ui/core/src/FormControl/FormControl").styles,
    MuiFormControlLabel: require("@/lib/vendor/@material-ui/core/src/FormControlLabel/FormControlLabel").styles,
    MuiFormLabel: require("@/lib/vendor/@material-ui/core/src/FormLabel/FormLabel").styles,
    MuiIconButton: require("@/lib/vendor/@material-ui/core/src/IconButton/IconButton").styles,
    MuiInputBase: require("@/lib/vendor/@material-ui/core/src/InputBase/InputBase").styles,
    Textarea2:  require("@/lib/vendor/@material-ui/core/src/InputBase/Textarea").styles,
    MuiInput: require("@/lib/vendor/@material-ui/core/src/Input/Input").styles,
    MuiInputAdornment: require("@/lib/vendor/@material-ui/core/src/InputAdornment/InputAdornment").styles,
    MuiInputLabel: require("@/lib/vendor/@material-ui/core/src/InputLabel/InputLabel").styles,
    MuiLinearProgress: require("@/lib/vendor/@material-ui/core/src/LinearProgress/LinearProgress").styles,
    MuiList: require("@/lib/vendor/@material-ui/core/src/List/List").styles,
    MuiListItem: require("@/lib/vendor/@material-ui/core/src/ListItem/ListItem").styles,
    MuiListItemIcon: require("@/lib/vendor/@material-ui/core/src/ListItemIcon/ListItemIcon").styles,
    MuiListItemText: require("@/lib/vendor/@material-ui/core/src/ListItemText/ListItemText").styles,
    MuiMenu: require("@/lib/vendor/@material-ui/core/src/Menu/Menu").styles,
    MuiMenuItem: require("@/lib/vendor/@material-ui/core/src/MenuItem/MenuItem").styles,
    MuiModal: require("@/lib/vendor/@material-ui/core/src/Modal/Modal").styles,
    MuiOutlinedInput: require("@/lib/vendor/@material-ui/core/src/OutlinedInput/OutlinedInput").styles,
    MuiPaper: require("@/lib/vendor/@material-ui/core/src/Paper/Paper").styles,
    MuiPopover: require("@/lib/vendor/@material-ui/core/src/Popover/Popover").styles,
    MuiPortal: require("@/lib/vendor/@material-ui/core/src/Portal/Portal").styles,
    MuiRadio: require("@/lib/vendor/@material-ui/core/src/Radio/Radio").styles,
    MuiRadioGroup: require("@/lib/vendor/@material-ui/core/src/RadioGroup/RadioGroup").styles,
    MuiSelect: require("@/lib/vendor/@material-ui/core/src/Select/Select").styles,
    MuiSlide: require("@/lib/vendor/@material-ui/core/src/Slide/Slide").styles,
    MuiSnackbar: require("@/lib/vendor/@material-ui/core/src/Snackbar/Snackbar").styles,
    MuiSvgIcon: require("@/lib/vendor/@material-ui/core/src/SvgIcon/SvgIcon").styles,
    MuiSwipeableDrawer: require("@/lib/vendor/@material-ui/core/src/SwipeableDrawer/SwipeableDrawer").styles,
    MuiSwitchBase: require("@/lib/vendor/@material-ui/core/src/internal/SwitchBase").styles,
    MuiSwitch: require("@/lib/vendor/@material-ui/core/src/Switch/Switch").styles,
    MuiTab: require("@/lib/vendor/@material-ui/core/src/Tab/Tab").styles,
    MuiTabs: require("@/lib/vendor/@material-ui/core/src/Tabs/Tabs").styles,
    MuiTextField: require("@/lib/vendor/@material-ui/core/src/TextField/TextField").styles,
    MuiToolbar: require("@/lib/vendor/@material-ui/core/src/Toolbar/Toolbar").styles,
    MuiTooltip: require("@/lib/vendor/@material-ui/core/src/Tooltip/Tooltip").styles,
  };

  // Filter out components that don't have any styles
  return Object.fromEntries(Object.entries(components).filter(([_, styles]) => !!styles));
}

export const usedMuiStyles = getUsedMuiStyles();
