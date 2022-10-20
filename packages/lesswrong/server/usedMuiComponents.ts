/**
 * As part of our static CSS generation, we need to get the styles for all of
 * the MaterialUI components that we use.
 *
 * When adding a new component below, we sure to prepend it's name with 'Mui',
 * and import the _file_ when the component is defined, not just the directory
 * (ie; "@material-ui/core/Badge/Badge" instead of "@material-ui/core/Badge").
 */
const getUsedMuiComponents = () => {
  const components = {
    MuiBadge: require("@material-ui/core/Badge/Badge").styles,
    MuiButton: require("@material-ui/core/Button/Button").styles,
    MuiCard: require("@material-ui/core/Card/Card").styles,
    MuiCardContent: require("@material-ui/core/CardContent/CardContent").styles,
    MuiCheckbox: require("@material-ui/core/Checkbox/Checkbox").styles,
    MuiChip: require("@material-ui/core/Chip/Chip").styles,
    MuiClickAwayListener: require("@material-ui/core/ClickAwayListener/ClickAwayListener").styles,
    MuiDialog: require("@material-ui/core/Dialog/Dialog").styles,
    MuiDialogActions: require("@material-ui/core/DialogActions/DialogActions").styles,
    MuiDialogContent: require("@material-ui/core/DialogContent/DialogContent").styles,
    MuiDialogContentText: require("@material-ui/core/DialogContentText/DialogContentText").styles,
    MuiDialogTitle: require("@material-ui/core/DialogTitle/DialogTitle").styles,
    MuiDivider: require("@material-ui/core/Divider/Divider").styles,
    MuiFormControl: require("@material-ui/core/FormControl/FormControl").styles,
    MuiFormControlLabel: require("@material-ui/core/FormControlLabel/FormControlLabel").styles,
    MuiFormLabel: require("@material-ui/core/FormLabel/FormLabel").styles,
    MuiIconButton: require("@material-ui/core/IconButton/IconButton").styles,
    MuiInput: require("@material-ui/core/Input/Input").styles,
    MuiInputAdornment: require("@material-ui/core/InputAdornment/InputAdornment").styles,
    MuiInputLabel: require("@material-ui/core/InputLabel/InputLabel").styles,
    MuiLinearProgress: require("@material-ui/core/LinearProgress/LinearProgress").styles,
    MuiList: require("@material-ui/core/List/List").styles,
    MuiListItem: require("@material-ui/core/ListItem/ListItem").styles,
    MuiListItemIcon: require("@material-ui/core/ListItemIcon/ListItemIcon").styles,
    MuiListItemText: require("@material-ui/core/ListItemText/ListItemText").styles,
    MuiMenu: require("@material-ui/core/Menu/Menu").styles,
    MuiMenuItem: require("@material-ui/core/MenuItem/MenuItem").styles,
    MuiNoSsr: require("@material-ui/core/NoSsr/NoSsr").styles,
    MuiOutlinedInput: require("@material-ui/core/OutlinedInput/OutlinedInput").styles,
    MuiPaper: require("@material-ui/core/Paper/Paper").styles,
    MuiPopover: require("@material-ui/core/Popover/Popover").styles,
    MuiPortal: require("@material-ui/core/Portal/Portal").styles,
    MuiRadio: require("@material-ui/core/Radio/Radio").styles,
    MuiRadioGroup: require("@material-ui/core/RadioGroup/RadioGroup").styles,
    MuiSelect: require("@material-ui/core/Select/Select").styles,
    MuiSlide: require("@material-ui/core/Slide/Slide").styles,
    MuiSnackbar: require("@material-ui/core/Snackbar/Snackbar").styles,
    MuiSvgIcon: require("@material-ui/core/SvgIcon/SvgIcon").styles,
    MuiSwipeableDrawer: require("@material-ui/core/SwipeableDrawer/SwipeableDrawer").styles,
    MuiTab: require("@material-ui/core/Tab/Tab").styles,
    MuiTable: require("@material-ui/core/Table/Table").styles,
    MuiTableBody: require("@material-ui/core/TableBody/TableBody").styles,
    MuiTableCell: require("@material-ui/core/TableCell/TableCell").styles,
    MuiTableRow: require("@material-ui/core/TableRow/TableRow").styles,
    MuiTabs: require("@material-ui/core/Tabs/Tabs").styles,
    MuiTextField: require("@material-ui/core/TextField/TextField").styles,
    MuiToolbar: require("@material-ui/core/Toolbar/Toolbar").styles,
    MuiTooltip: require("@material-ui/core/Tooltip/Tooltip").styles,
  };

  // Filter out components that don't have any styles
  return Object.keys(components).reduce((result, componentName) => {
    return components[componentName]
      ? {...result, [componentName]: components[componentName]}
      : result;
  }, {});
}

export const usedMuiComponents = getUsedMuiComponents();
